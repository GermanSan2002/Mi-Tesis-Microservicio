import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { TokenService } from './token.service';
import { CredentialsDTO } from 'src/dto/credentialsDTO';
import { SesionService } from './sesion.service';
import { CreateSesionDTO } from 'src/dto/sesionDTO';
import { OperacionService } from './operacion.service';
import { TipoOperacion } from 'src/entities/tipo-operacion.enum';
import { UsuarioService } from './usuario.service';
import { EstadosSesion } from 'src/entities/estadosSesiones.enum';
import { EstadosEntidades } from 'src/entities/estadosEntidades';
import { CambiarContraseñaDTO, RecuperarContraseñaSolicitudDTO } from 'src/dto/recuperarContraseñaDTO';
import { Cliente } from 'src/entities/cliente.entity';
import { Usuario } from 'src/entities/usuario.entity';

dotenv.config();

const saltRounds = parseInt(process.env.HASH_SALT_ROUNDS || '10', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly sesionService: SesionService,
    private readonly operacionService: OperacionService,
    private readonly tokenService: TokenService,
    private readonly dataSource: DataSource,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async login(
    credentialsDTO: CredentialsDTO,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = credentialsDTO;

    // Buscar el usuario por correo electrónico
    const user = await this.usuarioService.findUsuarioByEmail(email);

    // Verificar si el usuario existe
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verificar la contraseña
    const isPasswordValid = await this.comparePassword(
      password,
      user.contraseña,
    );
    if (!isPasswordValid) {
      // Registrar la operación de inicio de sesión fallido
      const usuarioFallido = await this.usuarioService.registrarLoginFallido(user);
      
      if(user.estado = EstadosEntidades.BAJA){
        throw new UnauthorizedException('Invalid email or password. User blocked, recover password');  
      }
      throw new UnauthorizedException('Invalid email or password');
    }

    // Comprobar que el usuario esta verificado
    if (!user.verificado) {
      throw new UnauthorizedException('User not verified');
    }

    // Iniciamos la transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear una nueva sesión para el usuario
      const createSesionDTO: CreateSesionDTO = {
        idUsuario: user.idUsuario,
        estado: EstadosSesion.ACTIVA,
        refreshTokenHash: '',
        expiraEn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      const sesion = await this.sesionService.create(
        createSesionDTO,
        queryRunner.manager,
      );

      // Registrar la operación de inicio de sesión exitoso
      await this.operacionService.create(
        {
          idUsuario: user.idUsuario,
          fechaRealizacion: new Date(),
          tipo: TipoOperacion.INICIAR_SESION,
          metadatos: { sesionId: sesion.idSesion },
        },
        queryRunner.manager,
      );

      // Generar los tokens
      const accessToken = this.tokenService.generateAccessToken(
        user,
        sesion.idSesion,
      );
      const refreshToken = this.tokenService.generateRefreshToken(
        user,
        sesion.idSesion,
      );

      // Guardar el hash del RefreshToken en la sesión
      const refreshTokenHash = await this.hashPassword(refreshToken);
      await this.sesionService.updateRefreshTokenHash(
        String(sesion.idSesion),
        refreshTokenHash,
        queryRunner.manager,
      );

      // Si todo el circuito se completó con éxito, confirmamo los cambios físicos en la BD
      await queryRunner.commitTransaction();

      return { accessToken, refreshToken };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Liberamos el queryRunner del pool de conexiones
      await queryRunner.release();
    }
  }

  async logout(refreshToken: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar y decodificar el RefreshToken
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      const sesion = await this.sesionService.findById(
        payload.sesionId,
        queryRunner.manager,
      );
      if (!sesion) {
        throw new UnauthorizedException('Session not found');
      }
      const sesionId = payload.sesionId;

      // Verificar si la sesión está activa
      const isActive = sesion.estado === 'A';
      if (!isActive) {
        throw new UnauthorizedException('Session is already inactive');
      }

      // Verificar si el hash del RefreshToken coincide con el almacenado en la sesión
      const isRefreshTokenValid = await this.comparePassword(
        refreshToken,
        sesion.refreshTokenHash,
      );
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Actualizar el estado de la sesión a inactiva
      sesion.refreshTokenHash = '';
      sesion.estado = EstadosSesion.INVALIDA;
      await this.sesionService.updateSesion(sesion, queryRunner.manager);

      // Registrar la operación de cierre de sesión
      await this.operacionService.create(
        {
          idUsuario: payload.userId,
          fechaRealizacion: new Date(),
          tipo: TipoOperacion.CERRAR_SESION,
          metadatos: {
            sesionId: sesionId,
          },
        },
        queryRunner.manager,
      );
      // Si todo el circuito se completó con éxito, confirmamo los cambios físicos en la BD
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async solicitarRecuperarContraseña(recuperarDTO: RecuperarContraseñaSolicitudDTO, cliente: Cliente): Promise<string>{
    //Obtener usuario con correo
    const usuarioRecuperar = await this.usuarioService.findUsuarioByEmailAndCliente(recuperarDTO.correo, cliente);

    //Verificar que el usuario existe
    if(!usuarioRecuperar){
      throw new NotFoundException("No existe un usuario con ese correo")
    }

    //Obtener token de recuperacion de clave
    const token = this.tokenService.generateRecuperarToken(usuarioRecuperar)

    await this.usuarioService.solicitudCambioContraseña(usuarioRecuperar, token);

    return token;
  }

  async confirmarCambioContraseña(userId: string, cambiarContraña: CambiarContraseñaDTO){
    const user = await this.usuarioService.findUsuarioById(userId);
    if(!user){
      throw new NotFoundException("Usuario no encontrado");
    }

    const contraseñaHash = await this.hashPassword(cambiarContraña.contraseña);

    user.contraseña = contraseñaHash

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try{
      //Registro la operacion de cambio de contraseña
      await this.operacionService.create(
        {
          idUsuario: user.idUsuario,
          fechaRealizacion: new Date(),
          tipo: TipoOperacion.CAMBIAR_CONTRASENA,
          metadatos: {
            cliente: user.idCliente,
          },
        },
        queryRunner.manager,
      );

      await this.usuarioService.saveUsuario(user);
      // Si todo el circuito se completó con éxito, confirmamo los cambios físicos en la BD
      await queryRunner.commitTransaction();      
    } catch(err) {
      await queryRunner.rollbackTransaction();

      throw err;      
    } finally{
      await queryRunner.release();
    }
  }
}
