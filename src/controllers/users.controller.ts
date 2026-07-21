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
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { BajaAltaDTO } from 'src/dto/bajaDTO';
import { CreateUsuarioDTO } from 'src/dto/usuarioDTO';
import { TipoUsuario } from 'src/entities/tipo-usuario.enum';
import { Usuario } from 'src/entities/usuario.entity';
import { ApiKeyGuard } from 'src/guard/apiKeyGuard';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { TipoUsuarioGuard } from 'src/guard/tipoUsuario.guard';
import { UsuarioService } from 'src/services/usuario.service';

class BusquedaMailDTO {
  @ApiProperty({
      description: 'Mail solicitado para la busqueda',
      example: 'ejemplo@gmail.com'
    })
  @IsString()
  @IsEmail()
  mail: string;
}

class BusquedaMailParcialDTO {
  @ApiProperty({
      description: 'Cadena para buscar por coincidencia de correo',
      example: 'ejemplo'
    })
  @IsString()
  mailParcial: string;
}

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

  @Patch('/:idUsuario/verify')
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

  @Get('/cliente')
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

  @Patch('/:idUsuario/baja')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TipoUsuarioGuard,ApiKeyGuard)
  @SetMetadata('tipo', [TipoUsuario.ADMINISTRADOR_CLIENTE])
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Dar de baja usuario de un cliente',
    description:
      'Permite a un usuario administrador de un cliente dar de baja un usuario registrado en su organizacion',
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'Clave secreta proporcionada al cliente',
    required: true,
  })
  @ApiBody({
    type: BajaAltaDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario dado de baja exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'El usuario no pertenece al cliente especificado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado.',
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya se encuentra dado de baja',
  })
  async darBajaUsuario(
    @Req() req: any,
    @Param('idUsuario') idUsuario: string,
    @Body() bajaDTO: BajaAltaDTO
  ){
    const idCliente = req.idCliente;

    return await this.usuarioService.darBajaUsuario(idUsuario, idCliente, bajaDTO.motivo);
  }

  @Patch('/:idUsuario/alta')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TipoUsuarioGuard,ApiKeyGuard)
  @SetMetadata('tipo', [TipoUsuario.ADMINISTRADOR_CLIENTE])
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Dar de alta usuario de un cliente',
    description:
      'Permite a un usuario administrador de un cliente dar de alta un usuario registrado en su organizacion dado de baja',
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'Clave secreta proporcionada al cliente',
    required: true,
  })
  @ApiBody({
    type: BajaAltaDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario dado de baja exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'El usuario no pertenece al cliente especificado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado.',
  })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya se encuentra dado de alta',
  })
  async darAltaUsuario(
    @Req() req: any,
    @Param('idUsuario') idUsuario: string,
    @Body() altaDTO: BajaAltaDTO
  ){
    const idCliente = req.idCliente;

    return await this.usuarioService.darAltaUsuario(idUsuario, idCliente, altaDTO.motivo);
  }

  @Get('/buscarMail')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TipoUsuarioGuard, ApiKeyGuard)
  @SetMetadata('tipo', [TipoUsuario.ADMINISTRADOR_CLIENTE])
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener un usuario por correo',
    description:
      'Permite a un usuario administrador de un cliente buscar un usuario especifico por mail',
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'Clave secreta proporcionada al cliente',
    required: true,
  })
  @ApiBody({
    type: BusquedaMailDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario obtenido con exito',
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
  async buscarUsuarioMail(@Req() req: any, @Body() buscarMailDTO: BusquedaMailDTO): Promise<Usuario | null>{
    const cliente = req.cliente;

    return await this.usuarioService.findUsuarioByEmailAndCliente(buscarMailDTO.mail, cliente);
  }

  @Get('/buscar/mailParcial')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, TipoUsuarioGuard, ApiKeyGuard)
  @SetMetadata('tipo', [TipoUsuario.ADMINISTRADOR_CLIENTE])
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener un usuario por correo',
    description:
      'Permite a un usuario administrador de un cliente buscar una lista de usuarios segun coincidencia en el mail',
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'Clave secreta proporcionada al cliente',
    required: true,
  })
  @ApiBody({
    type: BusquedaMailParcialDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario obtenido con exito',
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
  async buscarUsuarioMailParcial(@Req() req: any, @Body() buscarMailDTO: BusquedaMailParcialDTO): Promise<Usuario[]>{
    const cliente = req.cliente;

    return await this.usuarioService.findUsuarioByEmailPrefixAndCliente(buscarMailDTO.mailParcial, cliente);
  }
}
