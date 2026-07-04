import { Injectable, UnauthorizedException,  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from 'src/entities/usuario.entity';
import { Rol } from 'src/entities/rol.entity';
import { Sesion } from 'src/entities/sesion.entity';
import { SesionService } from './sesion.service';

export interface AccessTokenPayload {
  userId: number;       // Basado en idUsuario de tu diagrama de clases
  idCliente: number;    // El Tenant ID crucial para el aislamiento de datos
  sesionId: number;     // ID de la sesión activa
  roles: string[];      // Roles asignados para RBAC
}

export interface RefreshTokenPayload {
  userId: number;
  sesionId: number;
}

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret';

if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
}
if (!refreshTokenSecret) {
    throw new Error('REFRESH_TOKEN_SECRET is not defined in the environment variables');
}

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    private readonly sesionService: SesionService,
    private readonly jwtService: JwtService, // Usamos el servicio nativo de NestJS
  ) {}

  /**
   * Genera el AccessToken incluyendo las restricciones de negocio y contexto de empresa
   */
  generateAccessToken(user: Usuario, sesionId: number): string {
    // Mapeamos los nombres de los roles según el atributo del modelo ('nombre' o 'descripcion')
    const userId = user.idUsuario;
    const idCliente = user.cliente.idCliente;
    const roles = user.roles || [];

    const roleNames = roles.map(role => role.nombre);

    const payload: AccessTokenPayload = {
      userId,
      idCliente, 
      sesionId,
      roles: roleNames,
    };

    // La configuración de expiración y secret se inyecta idealmente desde el módulo
    return this.jwtService.sign(payload, {
      expiresIn: '1h',
    });
  }

  /**
   * Genera el RefreshToken (solo necesita identificar al usuario)
   */
  generateRefreshToken(user: Usuario, sesionId: number): string {
    const userId = user.idUsuario;

    const payload: RefreshTokenPayload = { userId, sesionId };
    
    return this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET || 'refresh-secret', // Secret alternativo si se prefiere separar
      expiresIn: '7d',
    });
  }

  /**
   * Verifica un AccessToken de manera segura
   */
  async verifyToken(token: string): Promise<AccessTokenPayload> {
    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(token, {secret: jwtSecret});

      await this.sesionService.validateSession(
          payload.sesionId,
          payload.userId,
      );

      return payload;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(token, {
        secret: refreshTokenSecret,
      });

      await this.sesionService.validateSession(
          payload.sesionId,
          payload.userId,
      );

      return payload;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      // Verificamos usando el secreto correspondiente al refresh token
      const decoded = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET || 'refresh-secret',
      });

      const user = await this.userRepository.findOne({
        where: { idUsuario: decoded.userId }, // Usamos idUsuario tal cual tu diagrama
        relations: ['roles', 'cliente'],     // Traemos el cliente asociado
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      await this.sesionService.validateSession(
          decoded.sesionId,
          decoded.userId,
      );
      
      return this.generateAccessToken(user, decoded.sesionId);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}