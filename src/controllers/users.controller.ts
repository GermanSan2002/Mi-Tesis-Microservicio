import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsInt, IsString, Max, Min } from 'class-validator';
import type { Response } from 'express';
import { BajaAltaDTO } from '../dto/bajaDTO';
import { CreateUsuarioDTO, ModifyUsuarioDTO } from '../dto/usuarioDTO';
import { EstadosEntidades } from '../entities/estadosEntidades';
import { Usuario } from '../entities/usuario.entity';
import { ApiKeyGuard } from '../guard/apiKeyGuard';
import { UsuarioService } from '../services/usuario.service';

export class PaginatedUsuarioQuery {
    @ApiProperty({
        description: 'Número de página para la paginación',
        example: 1,
    })
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiProperty({
        description: 'Número de elementos por página',
        example: 10,
    })
    @IsInt()
    @Min(10)
    @Max(100)
    limit: number = 10;

    @ApiPropertyOptional({
        description: 'Cadena para buscar por coincidencia de correo',
        example: 'ejemplo'
    })
    @IsString()
    mailParcial?: string;

    @ApiPropertyOptional({
        description: 'Mail solicitado para la busqueda',
        example: 'ejemplo@gmail.com'
    })
    @IsEmail()
    mail?: string;

    @ApiPropertyOptional({
        description: 'Estado de verificación del usuario',
        example: true
    })
    @IsBoolean()
    verified?: boolean;

    @ApiPropertyOptional({
        description: 'Estado del usuario',
        example: EstadosEntidades.ALTA
    })
    @IsEnum(EstadosEntidades)
    estado?: EstadosEntidades;
}

class RolesDTO {
  @ApiProperty({
      description: 'Lista de roles',
      example: ['rol1', 'rol2']
    })
  @IsString({ each: true })
  roles: string[];
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
    @Res() res: Response
  ) {
    const idCliente = req.idCliente;

    const respuesta = await this.usuarioService.registerUserCliente(usuarioDTO, idCliente, req);
    return res.status(201).json(respuesta);
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
    @Res() res: Response
  ) {
    const idCliente = req.idCliente;

    const respuesta = await this.usuarioService.verifyUserCliente(idCliente, idUsuario, req);
    return res.status(200).json(respuesta);
  }

  @Patch('/:idUsuario/asign-roles')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: 'Asignar roles a un usuario asociado a un cliente específico',
    description:
      'Permite asignar roles a un usuario, registrando la auditoría de forma transaccional.',
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'Clave secreta proporcionada al cliente',
    required: true,
  })
  @ApiParam({
    name: 'idUsuario',
    description: 'ID del usuario a asignar roles',
    type: String,
    example: 'User_01',
  })
  @ApiBody({
    description: 'Lista de roles a asignar',
    type: RolesDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Roles asignados exitosamente.',
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
  async asignRolesUsuario(
    @Req() req: any,
    @Param('idUsuario') idUsuario: string,
    @Body() rolesDTO: RolesDTO,
    @Res() res: Response
  ) {
    const idCliente = req.idCliente;

    const respuesta = await this.usuarioService.asignarRolesUsuario(idUsuario, idCliente, rolesDTO.roles, req);
    return res.status(200).json(respuesta);
  }

  @Patch('/:idUsuario/remove-roles')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: 'Remover roles de un usuario asociado a un cliente específico',
    description:
      'Permite remover roles de un usuario, registrando la auditoría de forma transaccional.',
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'Clave secreta proporcionada al cliente',
    required: true,
  })
  @ApiParam({
    name: 'idUsuario',
    description: 'ID del usuario a remover roles',
    type: String,
    example: 'User_01',
  })
  @ApiBody({
    description: 'Lista de roles a remover',
    type: RolesDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Roles removidos exitosamente.',
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
    status: 500,
    description: 'Error interno del servidor.',
  })
  async removerRolesUsuario(
    @Req() req: any,
    @Param('idUsuario') idUsuario: string,
    @Body() rolesDTO: RolesDTO,
    @Res() res: Response
  ){
    const idCliente = req.idCliente;

    const respuesta = await this.usuarioService.removerRolesUsuario(idUsuario, idCliente, rolesDTO.roles, req);
    return res.status(200).json(respuesta);
  }

  @Get('/cliente')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard)
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
  @ApiQuery({ name: 'page', required: true, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, example: 10 })
  @ApiQuery({ name: 'mailParcial', required: false, type: String, example: 'ejemplo' })
  @ApiQuery({ name: 'mail', required: false, type: String, example: 'example@domain.com' })
  @ApiQuery({ name: 'verified', required: false, type: Boolean, example: true })
  @ApiQuery({ name: 'estado', required: false, enum: EstadosEntidades})
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida con exito',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado.',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor.',
  })
  async getUsersClient(@Req() req: any, @Query() query: PaginatedUsuarioQuery, @Res() res: Response) {
    const idCliente = req.idCliente;

    const respuesta = await this.usuarioService.getUsuariosClientes(idCliente, query);
    return res.status(200).json(respuesta);
  }

  @Patch('/:idUsuario/baja')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: 'Dar de baja usuario de un cliente',
    description:
      'Permite a un cliente dar de baja un usuario registrado en su organizacion',
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
    @Body() bajaDTO: BajaAltaDTO,
    @Res() res: Response
  ){
    const idCliente = req.idCliente;

    const respuesta = await this.usuarioService.darBajaUsuario(idUsuario, idCliente, bajaDTO.motivo, req);
    return res.status(200).json(respuesta);
  }

  @Patch('/:idUsuario/alta')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: 'Dar de alta usuario de un cliente',
    description:
      'Permite a un cliente dar de alta un usuario registrado en su organizacion dado de baja',
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
    @Body() altaDTO: BajaAltaDTO,
    @Res() res: Response
  ){
    const idCliente = req.idCliente;

    const respuesta = await this.usuarioService.darAltaUsuario(idUsuario, idCliente, altaDTO.motivo, req);
    return res.status(200).json(respuesta);
  }

  @Get('/:idUsuario')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: 'Obtener un usuario por id',
    description:
      'Permite a un cliente buscar un usuario por ID',
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'Clave secreta proporcionada al cliente',
    required: true,
  })
  async getUsuario(
    @Req() req: any,
    @Param('idUsuario') idUsuario: string,
    @Res() res: Response
  ){
    const idCliente = req.idCliente;

    const user = await this.usuarioService.findUsuarioClientById(idUsuario, idCliente);

    return res.status(200).json(user);
  }

  @Patch('/update/:idUsuario')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar usuario',
    description:
      'Permite a un cliente actualizar los datos de un usuario de su organizacion',
  })
  @ApiHeader({
    name: 'X-API-Key',
    description: 'Clave secreta proporcionada al cliente',
    required: true,
  })
  @ApiBody({
    type: ModifyUsuarioDTO
  })
  async updateUsuario(
    @Req() req: any,
    @Param('idUsuario') idUsuario: string,
    @Body() updateUsuario: ModifyUsuarioDTO,
    @Res() res: Response
  ){
    const idCliente = req.idCliente;

    const respuesta = await this.usuarioService.updateUsuario(idUsuario, idCliente, updateUsuario, req);

    return res.status(200).json(respuesta);
  }
}
