import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
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

import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { CredentialsDTO } from '../dto/credentialsDTO';
import { LogoutDTO } from '../dto/logoutDTO';
import { CambiarContraseñaDTO, RecuperarContraseñaSolicitudDTO } from '../dto/recuperarContraseñaDTO';
import { ApiKeyGuard } from '../guard/apiKeyGuard';
import { RecuperarPassGuard } from '../guard/recuperarPass.guard';

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
  ) { }

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
    const hash = await this.authService.hashPassword(hashDTO.password);

    return res.status(200).json({
      hash,
    });
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión del usuario' })
  @ApiBody({ type: CredentialsDTO })
  @ApiResponse({ status: 200, description: 'Login successful, token returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Req() req: any, @Body() credentialsDTO: CredentialsDTO, @Res() res: Response) {
    const { accessToken, refreshToken } =
      await this.authService.login(credentialsDTO, req);
    res.status(200).json({ accessToken, refreshToken });
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
    await this.authService.logout(logoutDTO.refreshToken, req);
    res.status(200).json({ message: 'Logout successful' });
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
    const decoded = await this.tokenService.verifyAccessToken(token);
    res.status(200).json({ decoded });
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
    const newAccessToken =
    await this.tokenService.refreshAccessToken(refreshToken);
    res.status(200).json({ accessToken: newAccessToken });
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
  async solicitudCambioContraseña(@Req() req: any, @Body() recuperarDTO: RecuperarContraseñaSolicitudDTO, @Res() res: Response) {
    const cliente = req.cliente;

    return await this.authService.solicitarRecuperarContraseña(recuperarDTO, cliente, req);
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
  async validarCambioContraseña(@Res() res: Response) {
    return res.status(200).json({ message: 'Token válido' });
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
  async confirmarCambioContraseña(@Req() req: any, @Body() cambioDTO: CambiarContraseñaDTO, @Res() res: Response) {
    const userid = req.usuarioId;
    await this.authService.confirmarCambioContraseña(userid, cambioDTO, req);
    return res.status(200).json({ message: 'Contraseña cambiada exitosamente' });
  };
}
