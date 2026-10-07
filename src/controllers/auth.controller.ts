import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from 'src/services/auth.service';
import { TokenService } from 'src/services/token.service';
import { CredentialsDTO } from 'src/dto/credentialsDTO';
import { LogoutDTO } from 'src/dto/logoutDTO';
import { CambiarContraseñaDTO, RecuperarContraseñaSolicitudDTO } from 'src/dto/recuperarContraseñaDTO';
import { ApiKeyGuard } from 'src/guard/apiKeyGuard';
import { RecuperarPassGuard } from 'src/guard/recuperarPass.guard';

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
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Req() req: any, @Body() credentialsDTO: CredentialsDTO, @Res() res: Response) {
    try {
      const { accessToken, refreshToken } =
        await this.authService.login(credentialsDTO, req);
      res.status(200).json({ accessToken, refreshToken });
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(404).json({ message: 'Unknown error occurred' });
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
  async logout(@Req() req: any, @Body() logoutDTO: LogoutDTO, @Res() res: Response) {
    try {
      await this.authService.logout(logoutDTO.refreshToken, req);
      res.status(200).json({ message: 'Logout successful' });
    }
    catch (error) {
      if (error instanceof UnauthorizedException) {
        res.status(401).json({ message: error.message });
      } else {
        res.status(404).json({ message: 'Unknown error occurred' });
      }
    }
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
  @ApiResponse({ 
    status: 401, 
    description: 'Token inválido o expirado' 
  })
  @ApiBody({
    description: 'Token JWT a decodificar',
    schema: { example: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } },
  })
  async checkAuth(@Req() req: any, @Body('token') token: string, @Res() res: Response) {
    try {
      const decoded = await this.tokenService.verifyAccessToken(token);
      res.status(200).json({ decoded });
    } catch (error) {
      res.status(401).json({ message: 'Invalid or expired token' });
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
  async refreshAccessToken(@Req() req: any, @Body('refreshToken') refreshToken: string, @Res() res: Response) {
    try {
      const newAccessToken =
        await this.tokenService.refreshAccessToken(refreshToken);
      res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
  }

  @Patch('/solitarRecuperacion')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ 
    summary: 'Generar el hash de una contraseña', 
    description: 'Genera un token de solicitud de cambio de contraseña'
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'Clave secreta proporcionada al cliente',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario verificado exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'El usuario no pertenece al cliente especificado.',
  })
  @ApiResponse({
    status: 404,
    description: 'No existe el usuario a recuperar.',
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya se encuentra verificado.',
  })
  async solicitudCambioContraseña(@Req() req: any, @Body() recuperarDTO: RecuperarContraseñaSolicitudDTO, @Res() res: Response){
    try {
      const cliente = req.cliente;

      return await this.authService.solicitarRecuperarContraseña(recuperarDTO, cliente, req);
    } catch (error) {
      res.status(400).json({ message: 'Error al solicitar recuperación de contraseña' });
    }
  }

  @Post('/validarCambioPass')
  @UseGuards(ApiKeyGuard, RecuperarPassGuard)
  @ApiOperation({ 
    summary: 'Validar solicitud de cambio de contraeña', 
    description: 'Valida un token de solicitud de cambio de contraseña.'
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'Clave secreta proporcionada al cliente para identificarse',
    required: true,
  })
  @ApiHeader({
    name: 'X-Token-Recover',
    description: 'Clave secreta proporcionada al cliente para el cambio de contraseña',
    required: true,
  })
  async validarCambioContraseña(@Res() res: Response){
    return res.status(200);
  }

  @Patch('/confirmarRecuperacion')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard, RecuperarPassGuard)
  @ApiOperation({ 
    summary: 'Confirma el cambio de una contraseña', 
    description: 'Valida un token de solicitud de cambio de contraseña. Se cambia la contraseña de un usuario'
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'Clave secreta proporcionada al cliente para identificarse',
    required: true,
  })
  @ApiHeader({
    name: 'X-Token-Recover',
    description: 'Clave secreta proporcionada al cliente para el cambio de contraseña',
    required: true,
  })
  async confirmarCambioContraseña(@Req() req: any, @Body() cambioDTO: CambiarContraseñaDTO, res: Response){
    const userid = req.usuarioId;

    await this.authService.confirmarCambioContraseña(userid, cambioDTO, req);
  };  
}
