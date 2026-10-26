import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from '../entities/usuario.entity';
import { DataSource, EntityManager, FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { CreateUsuarioDTO, ModifyUsuarioDTO } from '../dto/usuarioDTO';
import { ClienteService } from './cliente.service';
import { TipoUsuario } from '../entities/tipo-usuario.enum';
import { Rol } from '../entities/rol.entity';
import { RolService } from './rol.service';
import { OperacionService } from './operacion.service';
import { TipoOperacion } from '../entities/tipo-operacion.enum';
import { EstadosEntidades } from '../entities/estadosEntidades';
import { Cliente } from '../entities/cliente.entity';
import { PaginatedUsuarioQuery } from '../controllers/users.controller';

dotenv.config();

const saltRounds = parseInt(process.env.HASH_SALT_ROUNDS || '10', 10);

export interface PaginatedUsuarioResult {
  data: Usuario[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
  }
}

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly rolService: RolService,
    private readonly operacionService: OperacionService,
    private readonly clienteService: ClienteService,
    private readonly dataSource: DataSource,
  ) { }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private getRepository(manager?: EntityManager): Repository<Usuario> {
    return manager ? manager.getRepository(Usuario) : this.usuarioRepository;
  }

  async findUsuarioById(
    idUsuario: string,
    manager?: EntityManager,
  ): Promise<Usuario | null> {
    const repo = this.getRepository(manager);
    return repo.findOne({
      where: { idUsuario },
      relations: ['roles', 'cliente'],
    });
  }

  async findUsuarioClientById(
    idUsuario: string,
    idCliente: string,
    manager?: EntityManager,
  ): Promise<Usuario | null> {
    const repo = this.getRepository(manager);

    const usuario = await repo.findOne({
      where: { idUsuario, idCliente },
      relations: ['roles', 'cliente'],
    });

    if (!usuario) {
      throw new NotFoundException("El usuario no existe");
    }

    return usuario;
  }

  async findUsuarioByEmail(
    email: string,
    manager?: EntityManager,
  ): Promise<Usuario | null> {
    const repo = this.getRepository(manager);
    return await repo.findOne({
      where: { correo: email },
      relations: ['roles', 'cliente'],
    });
  }

  async findUsuarioByEmailAndCliente(
    email: string,
    cliente: Cliente,
    manager?: EntityManager,
  ): Promise<Usuario | null> {
    const repo = this.getRepository(manager);
    return repo.findOne({
      where: { correo: email, cliente },
      relations: ['roles', 'cliente'],
    });
  }

  async findUsuarioByEmailPrefixAndCliente(
    emailPrefix: string,
    cliente: Cliente,
    manager?: EntityManager,
  ): Promise<Usuario[]> {
    const repo = this.getRepository(manager);
    return repo.find({
      where: { correo: ILike(`${emailPrefix}`), cliente },
      relations: ['roles', 'cliente'],
    });
  }

  async saveUsuario(
    user: Usuario,
    manager?: EntityManager,
  ): Promise<Usuario> {
    const repo = this.getRepository(manager);

    const save = repo.save(user);

    return save;
  }

  async saveUsuarioHashPassword(
    user: Usuario,
    manager?: EntityManager,
  ): Promise<Usuario> {
    const repo = this.getRepository(manager);

    const passHash = await this.hashPassword(user.contraseña);
    user.contraseña = passHash;

    const save = repo.save(user);

    return save;
  }

  async updateUsuario(
    idUsuario: string,
    cliente: Cliente,
    updateUsuario: ModifyUsuarioDTO,
    req: any
  ) {
    const existingUser = await this.findUsuarioClientById(idUsuario, cliente.idCliente)
    if (!existingUser) {
      throw new NotFoundException('No existe el usuario');
    }

    if (updateUsuario.contraseña !== undefined) {
      existingUser.contraseña = await this.hashPassword(
        updateUsuario.contraseña,
      );
    }

    if (updateUsuario.correo !== undefined) {
      const usuarioCorreo = await this.findUsuarioByEmailAndCliente(updateUsuario.correo, cliente);

      if (
        usuarioCorreo &&
        usuarioCorreo.idUsuario !== existingUser.idUsuario
      ) {
        throw new ConflictException(
          'El mail ya está registrado para el cliente',
        );
      }

      existingUser.correo = updateUsuario.correo;
    }

    if (updateUsuario.estado !== undefined) {
      existingUser.estado = updateUsuario.estado;
    }

    if (updateUsuario.parametros !== undefined) {
      existingUser.parametros = updateUsuario.parametros;
    }

    if (updateUsuario.tipo !== undefined) {
      existingUser.tipo = updateUsuario.tipo;
    }

    if (updateUsuario.verificado !== undefined) {
      existingUser.verificado = updateUsuario.verificado;
    }

    // Obtener datos para la operacion de actualización de usuario
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Ejecutar Guardado y Auditoría en una Transacción Atómica
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      //  Guardar el usuario usando el manager de la transacción
      const usuario = await queryRunner.manager.save(Usuario, existingUser);

      // Registrar la auditoría pasándole el manager de la transacción activa
      await this.operacionService.create(
        {
          idUsuario: usuario.idUsuario,
          idCliente: cliente.idCliente,
          fechaRealizacion: new Date(),
          tipo: TipoOperacion.ACTUALIZAR_USUARIO,
          metadatos: {
            ipAddress: ipAddress,
            userAgent: userAgent
          },
        },
        queryRunner.manager,
      );

      // Se impacta la base de datos definitivamente
      await queryRunner.commitTransaction();
      return usuario;
    } catch (err) {
      // Si algo falla, el rollback deshace el usuario y la operación
      await queryRunner.rollbackTransaction();

      if (
        err instanceof NotFoundException ||
        err instanceof ConflictException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }

      throw new InternalServerErrorException('Could not register user');
    } finally {
      await queryRunner.release();
    }
  }

  async getUsuariosClientes(
    idCliente: string,
    query: PaginatedUsuarioQuery,
    manager?: EntityManager,
  ): Promise<PaginatedUsuarioResult> {
    // Obtener repositorio
    const repo = this.getRepository(manager);

    const whereConditions: FindOptionsWhere<Usuario> = {
      cliente: { idCliente: idCliente },
    };

    if (query.mail !== undefined) {
      whereConditions.correo = query.mail;
    } else if (query.mailParcial !== undefined) {
      whereConditions.correo = ILike(`%${query.mailParcial}%`);
    }
    if (query.verified !== undefined) {
      whereConditions.verificado = query.verified;
    }
    if (query.estado !== undefined) {
      whereConditions.estado = query.estado;
    }

    const [data, total] = await repo.findAndCount({
      where: whereConditions,
      order: { correo: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      data,
      meta: {
        totalItems: total,
        itemsPerPage: query.limit,
        currentPage: query.page,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async registerUserCliente(
    usuarioDTO: CreateUsuarioDTO,
    cliente: Cliente,
    req: any
  ): Promise<Usuario> {
    // verificar si el correo ya está registrado en ese cliente
    const existingUser = await this.findUsuarioByEmailAndCliente(usuarioDTO.correo, cliente);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Obtener y validar los roles del cliente
    let roles: Rol[] = [];

    if (usuarioDTO.roles?.length) {
      roles = await this.rolService.findRolesByClienteId(cliente.idCliente);

      const rolesIdsCliente = new Set(roles.map((rol) => rol.idRol));

      const invalidRoles = usuarioDTO.roles.filter(
        (idRol) => !rolesIdsCliente.has(idRol),
      );

      if (invalidRoles.length > 0) {
        throw new BadRequestException(
          `The following roles do not belong to the client: ${invalidRoles.join(', ')}`,
        );
      }

      // Conservar únicamente los roles solicitados
      roles = roles.filter((rol) => usuarioDTO.roles!.includes(rol.idRol));
    }

    // Encriptar contraseña
    const hashedPassword = await this.hashPassword(usuarioDTO.contraseña);

    // Crear usuario
    const usuarioNuevo = this.usuarioRepository.create({
      correo: usuarioDTO.correo,
      contraseña: hashedPassword,
      tipo: TipoUsuario.CLIENTE,
      parametros: usuarioDTO.parametros,
      estado: EstadosEntidades.ALTA,
      verificado: false,
      cliente: cliente,
      roles,
    });

    // Obtener datos para la operacion de creación de usuario
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Ejecutar Guardado y Auditoría en una Transacción Atómica
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      //  Guardar el usuario usando el manager de la transacción
      const usuario = await queryRunner.manager.save(Usuario, usuarioNuevo);

      // Registrar la auditoría pasándole el manager de la transacción activa
      await this.operacionService.create(
        {
          idUsuario: usuario.idUsuario,
          idCliente: cliente.idCliente,
          fechaRealizacion: new Date(),
          tipo: TipoOperacion.CREAR_USUARIO,
          metadatos: {
            ipAddress: ipAddress,
            userAgent: userAgent
          },
        },
        queryRunner.manager,
      );

      // Se impacta la base de datos definitivamente
      await queryRunner.commitTransaction();
      return usuario;
    } catch (err) {
      // Si algo falla, el rollback deshace el usuario y la operación
      await queryRunner.rollbackTransaction();

      if (
        err instanceof NotFoundException ||
        err instanceof ConflictException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }

      throw new InternalServerErrorException('Could not register user');
    } finally {
      await queryRunner.release();
    }
  }

  async verifyUserCliente(idCliente: string, idUsuario: string, req: any): Promise<void> {
    const usuarioVerificar = await this.findUsuarioClientById(idUsuario, idCliente);
    // Verificar que el usuario existe
    if (!usuarioVerificar) {
      throw new NotFoundException('User not found');
    }

    // Verificar si ya estaba verificado
    if (usuarioVerificar.verificado) {
      throw new ConflictException('User is already verified');
    }

    // Establecer estado de usuario como verificado
    usuarioVerificar.verificado = true;
    usuarioVerificar.estado = EstadosEntidades.ALTA;

    // Obtener datos para la operacion de verificación de usuario
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repo = this.getRepository(queryRunner.manager)

      // Registramos la operacion
      await this.operacionService.create(
        {
          idUsuario: usuarioVerificar.idUsuario,
          idCliente: usuarioVerificar.idCliente,
          fechaRealizacion: new Date(),
          tipo: TipoOperacion.VERIFICAR_USUARIO, // Asegúrate de tener este tipo en tu enum
          metadatos: {
            idClienteVerificador: idCliente,
            ipAddress: ipAddress,
            userAgent: userAgent
          },
        },
        queryRunner.manager,
      );
      await repo.save(usuarioVerificar);

      // Confirmar todos los cambios en la base de datos
      await queryRunner.commitTransaction();
    } catch (error) {
      // Si algo falla, revertimos cualquier cambio en el usuario o auditoría
      await queryRunner.rollbackTransaction();

      // Relanzamos las excepciones controladas de NestJS para no perder el código HTTP correcto
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Could not verify user');
    } finally {
      // Liberar la conexión al pool obligatoriamente
      await queryRunner.release();
    }
  }

  async darAltaUsuario(idUsuario: string, idCliente: string, req: any, motivo?: string,): Promise<Usuario> {
    const usuario = await this.findUsuarioClientById(idUsuario, idCliente);

    if (!usuario) {
      throw new NotFoundException("Usuario no encontrado")
    }
    if (usuario.estado == EstadosEntidades.ALTA) {
      throw new BadRequestException("Usuario ya dado de alta");
    }

    // obtener datos para la operacion de dar de alta usuario
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repositorio = this.getRepository(queryRunner.manager);

      usuario.estado = EstadosEntidades.ALTA;

      await this.operacionService.create(
        {
          idUsuario: usuario.idUsuario,
          idCliente: usuario.cliente.idCliente,
          fechaRealizacion: new Date(),
          tipo: TipoOperacion.DAR_ALTA_USUARIO,
          metadatos: {
            motivo: motivo,
            ipAddress: ipAddress,
            userAgent: userAgent
          },
        },
        queryRunner.manager,
      );

      const usuarioGuardado = await repositorio.save(usuario);
      await queryRunner.commitTransaction();
      return usuarioGuardado;
    } catch (err) {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException('Could not update user');
    } finally {
      await queryRunner.release();
    }
  }

  async darBajaUsuario(idUsuario: string, idCliente: string, motivo: string, req: any): Promise<Usuario> {
    const usuario = await this.findUsuarioClientById(idUsuario, idCliente);

    if (!usuario) {
      throw new NotFoundException("Usuario no encontrado")
    }
    if (usuario.estado == EstadosEntidades.BAJA) {
      throw new BadRequestException("Usuario ya dado de baja");
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repositorio = this.getRepository(queryRunner.manager);

      usuario.estado = EstadosEntidades.BAJA;

      await this.operacionService.create(
        {
          idUsuario: usuario.idUsuario,
          idCliente: usuario.cliente.idCliente,
          fechaRealizacion: new Date(),
          tipo: TipoOperacion.DAR_BAJA_USUARIO, // Asegúrate de tener este tipo en tu enum
          metadatos: {
            motivo: motivo,
            ipAddress: ipAddress,
            userAgent: userAgent
          },
        },
        queryRunner.manager,
      );

      const usuarioGuardado = await repositorio.save(usuario);
      await queryRunner.commitTransaction();

      return usuarioGuardado;
    } catch (err) {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException('Could not update user');
    } finally {
      await queryRunner.release();
    }
  }

  async registrarLoginFallido(usuario: Usuario, req: any): Promise<Usuario> {
    let mensajeRegistro: string;
    if (usuario.verificado) {
      mensajeRegistro = "Contraseña incorrecta";
      usuario.intentosFallidosLogin++;
    } else if (usuario.estado === EstadosEntidades.BAJA) {
      mensajeRegistro = "Usuario dado de baja";
      usuario.intentosFallidosLogin++;
    }
    mensajeRegistro = "Usuario no verificado";

    if (usuario.intentosFallidosLogin >= 3 && usuario.estado === EstadosEntidades.ALTA) {
      usuario.estado = EstadosEntidades.BAJA;
      usuario.intentosFallidosLogin = 0;
    }

    // Obtener datos para la operacion de inicio de sesión
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repositorio = this.getRepository(queryRunner.manager);

      await this.operacionService.create(
        {
          idUsuario: usuario.idUsuario,
          idCliente: usuario.cliente.idCliente,
          fechaRealizacion: new Date(),
          tipo: TipoOperacion.INICIAR_SESION_FAIL,
          metadatos: {
            motivo: mensajeRegistro,
            ipAddress: ipAddress,
            userAgent: userAgent
          },
        },
        queryRunner.manager,
      );

      if (usuario.estado == EstadosEntidades.BAJA) {
        await this.operacionService.create(
          {
            idUsuario: usuario.idUsuario,
            idCliente: usuario.cliente.idCliente,
            fechaRealizacion: new Date(),
            tipo: TipoOperacion.DAR_BAJA_USUARIO,
            metadatos: {
              motivo: 'Intentos de sesion fallidos consecutivos. Bloqueo de seguridad',
              ipAddress: ipAddress,
              userAgent: userAgent
            },
          },
          queryRunner.manager
        );
      }

      await repositorio.save(usuario);

      return usuario;
    } catch (err) {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException('Could not update user');
    } finally {
      await queryRunner.release();
    }
  }

  async solicitudCambioContraseña(usuario: Usuario, token: string, req: any): Promise<void> {
    const hashToken = await this.hashPassword(token);

    usuario.recuperacionTokenHash = hashToken;

    // Obtener datos para la operacion de solicitud de cambio de contraseña
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repositorio = this.getRepository(queryRunner.manager);

      const operacion = await this.operacionService.create(
        {
          idUsuario: usuario.idUsuario,
          idCliente: usuario.cliente.idCliente,
          fechaRealizacion: new Date(),
          metadatos: {
            ipAddress: ipAddress,
            userAgent: userAgent
          },
          tipo: TipoOperacion.CAMBIAR_CONTRASENA,
        },
        queryRunner.manager,
      );

      await repositorio.save(usuario);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.log(err);
      throw new InternalServerErrorException('Could not update user');
    } finally {
      await queryRunner.release();
    }
  }

  async verifySolicitudCambio(idUsuario: string, token: string): Promise<Usuario> {
    const usuario = await this.findUsuarioById(idUsuario);

    if (!usuario) {
      throw new NotFoundException("No se encontro el usaurio de la solicitud");
    }

    const tokenValido = await this.comparePassword(token, usuario.recuperacionTokenHash);

    if (!tokenValido) {
      throw new UnauthorizedException("El token proporcionado no es valido")
    }

    return usuario;
  }

  async asignarRolesUsuario(idUsuario: string, idCliente: string, roles: string[], req: any): Promise<Usuario> {
    // Verificar que el usuario exista y pertenezca al cliente
    if (!roles || roles.length === 0) {
      throw new BadRequestException('No roles provided for assignment');
    }
    const usuario = await this.findUsuarioClientById(idUsuario, idCliente);
    let rolesAsignados: Rol[] = [];
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado o no pertenece al cliente');
    }

    for (const idRol of roles) {
      const rol = await this.rolService.findRolesByRolAndClienteId(idRol, idCliente);
      if (rol) {
        rolesAsignados.push(rol);
      } else {
        throw new BadRequestException(`El rol con ID ${idRol} no pertenece al cliente`);
      }
    }

    usuario.roles = [
      ...new Map(
        [...(usuario.roles ?? []), ...rolesAsignados].map(rol => [
          rol.idRol,
          rol,
        ]),
      ).values(),
    ];

    // Obtener datos para la operacion de asignación de roles
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repoUsuario = this.getRepository(queryRunner.manager);

      await this.operacionService.create(
        {
          idUsuario: usuario.idUsuario,
          idCliente: usuario.cliente.idCliente,
          fechaRealizacion: new Date(),
          metadatos: {
            ipAddress: ipAddress,
            userAgent: userAgent,
            rolesAsignados: rolesAsignados.map(r => r.idRol)
          },
          tipo: TipoOperacion.ASIGNAR_ROL,
        },
        queryRunner.manager,
      );

      await repoUsuario.save(usuario);
      await queryRunner.commitTransaction();
      return usuario;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Could not assign roles to user');
    } finally {
      await queryRunner.release();
    }
  }

  async removerRolesUsuario(idUsuario: string, idCliente: string, roles: string[], req: any): Promise<Usuario> {
    // Verificar que el usuario exista y pertenezca al cliente
    if (!roles || roles.length === 0) {
      throw new BadRequestException('No roles provided for removal');
    }
    const usuario = await this.findUsuarioClientById(idUsuario, idCliente);
    const rolesARemover: Rol[] = [];

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado o no pertenece al cliente');
    }
    for (const idRol of roles) {
      const rol = usuario.roles.find(r => r.idRol === idRol);
      if (rol) {
        rolesARemover.push(rol);
      } else {
        throw new BadRequestException(`El rol con ID ${idRol} no está asignado al usuario`);
      }
    }

    usuario.roles = usuario.roles.filter(r => !rolesARemover.includes(r));

    // Obtener datos para la operacion de asignación de roles
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repoUsuario = this.getRepository(queryRunner.manager);

      await this.operacionService.create(
        {
          idUsuario: usuario.idUsuario,
          idCliente: usuario.cliente.idCliente,
          fechaRealizacion: new Date(),
          metadatos: {
            ipAddress: ipAddress,
            userAgent: userAgent,
            rolesRemovidos: rolesARemover.map(r => r.idRol)
          },
          tipo: TipoOperacion.REMOVER_ROL,
        },
        queryRunner.manager,
      );
      await repoUsuario.save(usuario);
      await queryRunner.commitTransaction();
      return usuario;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Could not remove roles from user');
    } finally {
      await queryRunner.release();
    }
  }
}
