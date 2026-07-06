import { Injectable, UnauthorizedException,  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from 'src/entities/usuario.entity';
import { SesionService } from './sesion.service';
import { UsuarioService } from './usuario.service';

export interface AccessTokenPayload {
  userId: string;       // Basado en idUsuario de tu diagrama de clases
  idCliente: string;    // El Tenant ID crucial para el aislamiento de datos
  sesionId: string;     // ID de la sesión activa
  roles: string[];      // Roles asignados para RBAC
}

export interface RefreshTokenPayload {
  userId: string;
  sesionId: string;
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
    private readonly usuarioService: UsuarioService,
    private readonly sesionService: SesionService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Genera el AccessToken incluyendo las restricciones de negocio y contexto de empresa
   */
  generateAccessToken(user: Usuario, sesionId: string): string {
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
  generateRefreshToken(user: Usuario, sesionId: string): string {
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
    // Crear el canal transaccional (QueryRunner)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar el secreto del Refresh Token de forma est stateless en memoria
      const decoded = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET || 'refresh-secret',
      });

      // Buscar al usuario usando el método transaccional de UsuarioService
      const user = await this.usuarioService.findUsuarioById(decoded.userId, queryRunner.manager);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Validar el estado de la sesión usando el manager transaccional activo
      await this.sesionService.validateSession(
        String(decoded.sesionId),
        String(decoded.userId),
        queryRunner.manager,
      );

      // Si todo el circuito de validación es correcto, confirmamos la transacción
      await queryRunner.commitTransaction();

      // Generamos el nuevo AccessToken (incluyendo idCliente y roles en el payload)
      return this.generateAccessToken(user, decoded.sesionId);

    } catch (error) {
      // Si falla cualquier paso, revertimos
      await queryRunner.rollbackTransaction();
      throw new UnauthorizedException('Invalid or expired refresh token');
    } finally {
      // Liberamos siempre la conexión del pool
      await queryRunner.release();
    }
  }
}