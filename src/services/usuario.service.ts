import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from 'src/entities/usuario.entity';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { CreateUsuarioDTO } from 'src/dto/usuarioDTO';
import { ClienteService } from './cliente.service';
import { TipoUsuario } from 'src/entities/tipo-usuario.enum';
import { Rol } from 'src/entities/rol.entity';
import { RolService } from './rol.service';
import { OperacionService } from './operacion.service';
import { TipoOperacion } from 'src/entities/tipo-operacion.enum';
import { EstadosEntidades } from 'src/entities/estadosEntidades';

dotenv.config();

const saltRounds = parseInt(process.env.HASH_SALT_ROUNDS || '10', 10);

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly rolService: RolService,
    private readonly operacionService: OperacionService,
    private readonly clienteService: ClienteService,
    private readonly dataSource: DataSource,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, saltRounds);
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

  async findUsuarioByEmail(
    email: string,
    manager?: EntityManager,
  ): Promise<Usuario | null> {
    const repo = this.getRepository(manager);
    return repo.findOne({
      where: { correo: email },
      relations: ['roles', 'cliente'],
    });
  }

  async getUsuariosClientes(
    idCliente: string,
    manager?: EntityManager,
  ): Promise<Usuario[]> {
    // Obtener repositorio
    const repo = this.getRepository(manager);

    // Verificar que el id proporcionado pertenezca a un cliente existente
    const clienteBuscar = await this.clienteService.findClienteById(
      idCliente,
      manager,
    );
    if (!clienteBuscar) {
      throw new NotFoundException('El cliente no existe');
    }

    // Obtener lista de usuarios que pertenecen al cliente
    return await repo.find({
      where: { cliente: { idCliente } },
      relations: ['roles', 'cliente'],
    });
  }

  async registerUserCliente(
    usuarioDTO: CreateUsuarioDTO,
    idCliente: string,
  ): Promise<Usuario> {
    // Verificar que el cliente exista
    const cliente = await this.clienteService.findClienteById(idCliente);
    if (!cliente) {
      throw new NotFoundException('Client not found');
    }

    // verificar si el correo ya está registrado
    const existingUser = await this.usuarioRepository.findOne({
      where: { correo: usuarioDTO.correo },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Obtener y validar los roles del cliente
    let roles: Rol[] = [];

    if (usuarioDTO.roles?.length) {
      roles = await this.rolService.findRolesByClienteId(idCliente);

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
      cliente,
      roles,
    });

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
          fechaRealizacion: new Date(),
          tipo: TipoOperacion.CREAR_USUARIO,
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

  async verifyUserCliente(idCliente: string, idUsuario: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Buscar al usuario
      const usuarioVerificar = await this.findUsuarioById(
        idUsuario,
        queryRunner.manager,
      );

      // Verificar que el usuario existe
      if (!usuarioVerificar) {
        throw new NotFoundException('User not found');
      }

      // Verificar si ya estaba verificado
      if (usuarioVerificar.verificado) {
        throw new ConflictException('User is already verified');
      }

      // Verificar que el cliente existe
      const cliente = await this.clienteService.findClienteById(
        idCliente,
        queryRunner.manager,
      );
      if (!cliente) {
        throw new NotFoundException('Client not found');
      }

      // Verificar que el usuario pertenezca al cliente
      if (
        !usuarioVerificar.cliente ||
        usuarioVerificar.cliente.idCliente !== idCliente
      ) {
        throw new BadRequestException(
          'The user does not belong to the specified client',
        );
      }

      // Establecer estado de usuario como verificado
      usuarioVerificar.verificado = true;
      usuarioVerificar.estado = EstadosEntidades.ALTA;
      await queryRunner.manager.save(Usuario, usuarioVerificar);

      // Registramos la operacion
      await this.operacionService.create(
        {
          idUsuario: usuarioVerificar.idUsuario,
          fechaRealizacion: new Date(),
          tipo: TipoOperacion.VERIFICAR_USUARIO, // Asegúrate de tener este tipo en tu enum
          metadatos: {
            idClienteVerificador: idCliente,
          },
        },
        queryRunner.manager,
      );

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

  async darAltaUsuario(idUsuario: string, idCliente: string, motivo?: string): Promise<void>{
    const usuario = await this.findUsuarioById(idUsuario);

    if(!usuario){
      throw new NotFoundException("Usuario no encontrado")
    }
    if(usuario.cliente.idCliente != idCliente){
      throw new ConflictException("El usuario no pertece al cliente");
    }
    if(usuario.estado == EstadosEntidades.ALTA){
      throw new BadRequestException("Usuario ya dado de alta");
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try{
      const repositorio = this.getRepository(queryRunner.manager);

      usuario.estado = EstadosEntidades.ALTA;

      await this.operacionService.create(
        {
          idUsuario: usuario.idUsuario,
          fechaRealizacion: new Date(),
          tipo: TipoOperacion.DAR_ALTA_USUARIO,
          metadatos: {
            motivo: motivo,
          },
        },
        queryRunner.manager,
      );

      repositorio.save(usuario);
    } catch (err) {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException('Could not update user');
    } finally {
      await queryRunner.release();
    }
  }

  async darBajaUsuario(idUsuario: string, idCliente: string, motivo: string): Promise<void>{
    const usuario = await this.findUsuarioById(idUsuario);

    if(!usuario){
      throw new NotFoundException("Usuario no encontrado")
    }
    if(usuario.cliente.idCliente != idCliente){
      throw new ConflictException("El usuario no pertece al cliente");
    }
    if(usuario.estado == EstadosEntidades.BAJA){
      throw new BadRequestException("Usuario ya dado de baja");
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try{
      const repositorio = this.getRepository(queryRunner.manager);

      usuario.estado = EstadosEntidades.BAJA;

      await this.operacionService.create(
        {
          idUsuario: usuario.idUsuario,
          fechaRealizacion: new Date(),
          tipo: TipoOperacion.DAR_BAJA_USUARIO, // Asegúrate de tener este tipo en tu enum
          metadatos: {
            motivo: motivo,
          },
        },
        queryRunner.manager,
      );

      repositorio.save(usuario);
    } catch (err) {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException('Could not update user');
    } finally {
      await queryRunner.release();
    }
  }

  async registrarLoginFallido(usuario: Usuario): Promise<Usuario>{
    usuario.intentosFallidosLogin++;

    if(usuario.intentosFallidosLogin>=3){
      usuario.estado = EstadosEntidades.BAJA;
      usuario.intentosFallidosLogin = 0;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try{
      const repositorio = this.getRepository(queryRunner.manager);

      await this.operacionService.create(
        {
          idUsuario: usuario.idUsuario,
          fechaRealizacion: new Date(),
          tipo: TipoOperacion.INICIAR_SESION_FAIL, // Asegúrate de tener este tipo en tu enum
          metadatos: {
            motivo: 'Intentos de sesion fallidos consecutivos. Bloqueo de seguridad',
          },
        },
        queryRunner.manager,
      );

      if(usuario.estado == EstadosEntidades.BAJA){
        await this.operacionService.create(
          {
            idUsuario: usuario.idUsuario,
            fechaRealizacion: new Date(),
            tipo: TipoOperacion.DAR_BAJA_USUARIO,
            metadatos: {
              motivo: 'Intentos de sesion fallidos consecutivos. Bloqueo de seguridad',
            },
          },
          queryRunner.manager
        );
      }

      repositorio.save(usuario);

      return usuario;
    } catch (err) {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException('Could not update user');
    } finally {
      await queryRunner.release();
    }
  }
}
