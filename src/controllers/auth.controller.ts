import {
  Body,
  Controller,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from 'src/services/auth.service';
import { TokenService } from 'src/services/token.service';
import { CredentialsDTO } from 'src/dto/credentialsDTO';
import { LogoutDTO } from 'src/dto/logoutDTO';

class HashDTO {
  @ApiProperty({
    example: 'pass1234',
    description: 'Password to be hashed',
  })
  password: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('hashPassword')
  @ApiOperation({ summary: 'Generar el hash de una contraseña' })
  @ApiBody({ type: HashDTO })
  @ApiResponse({
    status: 200,
    description: 'Hash generado correctamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Error al generar el hash',
  })
  async hashPassword(@Body() hashDTO: HashDTO, @Res() res: Response) {
    try {
      const hash = await this.authService.hashPassword(hashDTO.password);

      return res.status(200).json({
        hash,
      });
    } catch (error: unknown) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión del usuario' })
  @ApiBody({ type: CredentialsDTO })
  @ApiResponse({ status: 200, description: 'Login successful, token returned' })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  async login(@Body() credentialsDTO: CredentialsDTO, @Res() res: Response) {
    try {
      const { accessToken, refreshToken } =
        await this.authService.login(credentialsDTO);
      res.status(200).json({ accessToken, refreshToken });
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: 'Unknown error occurred' });
      }
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Cerrar la sesión del usuario' })
  @ApiBody({ type: LogoutDTO })
  @ApiResponse({
    status: 201,
    description: 'Sesión cerrada correctamente',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh Token inválido o sesión no válida',
  })
  async logout(@Body() logoutDTO: LogoutDTO) {
    await this.authService.logout(logoutDTO.refreshToken);

    return {
      message: 'Logout successful',
    };
  }

  @Post('checkAuth')
  @ApiOperation({
    summary: 'Decodificar un token JWT para verificar autentificacion',
  })
  @ApiResponse({
    status: 201,
    description: 'Token decodificado correctamente',
    schema: { example: { decoded: { userId: '12345' } } },
  })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  @ApiBody({
    description: 'Token JWT a decodificar',
    schema: { example: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } },
  })
  async checkAuth(@Body('token') token: string) {
    try {
      const decoded = await this.tokenService.verifyToken(token);
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refrescar el access token utilizando el refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Nuevo access token generado',
    schema: { example: { accessToken: 'newAccessToken' } },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado',
  })
  @ApiBody({
    description: 'Refresh token para solicitar un nuevo access token',
    schema: {
      example: { refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    },
  })
  async refreshAccessToken(@Body('refreshToken') refreshToken: string) {
    try {
      const newAccessToken =
        await this.tokenService.refreshAccessToken(refreshToken);
      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
