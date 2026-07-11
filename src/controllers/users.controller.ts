import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUsuarioDTO } from 'src/dto/usuarioDTO';
import { TipoUsuario } from 'src/entities/tipo-usuario.enum';
import { Usuario } from 'src/entities/usuario.entity';
import { ApiKeyGuard } from 'src/guard/apiKeyGuard';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { TipoUsuarioGuard } from 'src/guard/tipoUsuario.guard';
import { UsuarioService } from 'src/services/usuario.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post('/registrar-usuario')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: 'Registrar un usuario desde la API de un cliente (M2M)',
    description:
      'Permite a un sistema externo integrado aprovisionar usuarios en su organización usando su API Key corporativa.',
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'Clave secreta proporcionada al cliente',
    required: true,
  })
  @ApiBody({
    type: CreateUsuarioDTO,
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado correctamente.',
    type: Usuario,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado.',
  })
  @ApiResponse({
    status: 409,
    description: 'El correo ya se encuentra registrado.',
  })
  @ApiResponse({
    status: 400,
    description: 'Los roles enviados no pertenecen al cliente.',
  })
  async registerUserCliente(
    @Req() req: any,
    @Body() usuarioDTO: CreateUsuarioDTO,
  ): Promise<Usuario> {
    const idCliente = req.idCliente;

    return await this.usuarioService.registerUserCliente(usuarioDTO, idCliente);
  }

  @Patch('/usuarios/:idUsuario/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: 'Verificar un usuario asociado a un cliente específico',
    description:
      'Cambia el estado del usuario a verificado y activo, registrando la auditoría de forma transaccional.',
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'Clave secreta proporcionada al cliente',
    required: true,
  })
  @ApiParam({
    name: 'idUsuario',
    description: 'ID del usuario a verificar',
    type: String,
    example: 'User_01',
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
    description: 'Cliente o Usuario no encontrado.',
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya se encuentra verificado.',
  })
  async verifyUserCliente(
    @Req() req: any,
    @Param('idUsuario') idUsuario: string,
  ): Promise<void> {
    const idCliente = req.idCliente;

    return await this.usuarioService.verifyUserCliente(idCliente, idUsuario);
  }

  @Get('/usuarios/cliente')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TipoUsuarioGuard, ApiKeyGuard)
  @SetMetadata('tipo', [TipoUsuario.ADMINISTRADOR_CLIENTE])
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener usuarios de empresas',
    description:
      'Permite a un usuario administrador de un cliente obtener la lista de usuarios registrados de su organizacion',
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'Clave secreta proporcionada al cliente',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida con exito',
  })
  @ApiResponse({
    status: 401,
    description:
      'No autorizado. El token de acceso es inválido, expiró o no fue provisto en la cabecera.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Prohibido. El tipo de usuario logueado no posee los privilegios suficientes para ejecutar esta operación.',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado.',
  })
  async getUsersClient(@Req() req: any): Promise<Usuario[]> {
    const idCliente = req.idCliente;

    return await this.usuarioService.getUsuariosClientes(idCliente);
  }
}
