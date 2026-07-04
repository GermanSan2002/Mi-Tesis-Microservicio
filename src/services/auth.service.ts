import {Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenService } from './token.service';
import { Usuario } from 'src/entities/usuario.entity';
import { CredentialsDTO } from 'src/dto/credentialsDTO';
import { SesionService } from './sesion.service';
import { CreateSesionDTO } from 'src/dto/sesionDTO';
import { OperacionService } from './operacion.service';
import { TipoOperacion } from 'src/entities/tipo-operacion.enum';

dotenv.config();

const saltRounds = parseInt(process.env.HASH_SALT_ROUNDS || '10', 10);

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    private readonly sesionService: SesionService,
    private readonly operacionService: OperacionService,
    private readonly tokenService: TokenService,
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

  
  async login(credentialsDTO: CredentialsDTO): Promise<{ accessToken: string, refreshToken: string }> {
    const { email, password } = credentialsDTO;
    // Buscar al usuario por correo electrónico y cargar sus roles y cliente
    const user = await this.userRepository.findOne({
      where: { correo: email },
      relations: ['roles', 'cliente'],
    });

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
      await this.operacionService.create({
        idUsuario: user.idUsuario,
        fechaRealizacion: new Date(),
        tipo: TipoOperacion.INICIAR_SESION_FAIL,
        metadatos: {
          motivo: 'Contraseña incorrecta',
        },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // Crear una nueva sesión para el usuario
    const createSesionDTO: CreateSesionDTO = {
      idUsuario: user.idUsuario,
      estado: 'A',
      refreshTokenHash: '',
      expiraEn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const sesion = await this.sesionService.create(createSesionDTO);

    await this.operacionService.create({
      idUsuario: user.idUsuario,
      fechaRealizacion: new Date(),
      tipo: TipoOperacion.INICIAR_SESION,
      metadatos: {
        sesionId: sesion.idSesion,
      },
    });

    // Generar el AccessToken y RefreshToken
    const accessToken = this.tokenService.generateAccessToken(user, sesion.idSesion);
    const refreshToken = this.tokenService.generateRefreshToken(user, sesion.idSesion);
    // Guardar el hash del RefreshToken en la sesión
    const refreshTokenHash = await this.hashPassword(refreshToken);
    await this.sesionService.updateRefreshTokenHash(
      sesion.idSesion,
      refreshTokenHash,
    );

    // Retornar los tokens al cliente
    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    // Verificar y decodificar el RefreshToken
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      const sesion = await this.sesionService.findById(payload.sesionId);
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
      const isRefreshTokenValid = await this.comparePassword(refreshToken, sesion.refreshTokenHash);
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Actualizar el estado de la sesión a inactiva
      sesion.refreshTokenHash = '';
      sesion.estado = 'I';
      await this.sesionService.updateSesion(sesion);

      // Registrar la operación de cierre de sesión
      await this.operacionService.create({
        idUsuario: payload.userId,
        fechaRealizacion: new Date(),
        tipo: TipoOperacion.CERRAR_SESION,
        metadatos: {
          sesionId: sesionId,
        },
      });

    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
