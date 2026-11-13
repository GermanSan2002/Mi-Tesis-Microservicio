import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateClienteDto, UpdateClienteDto } from '../dto/clienteDTO';
import { TipoUsuario } from '../entities/tipo-usuario.enum';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { TipoUsuarioGuard } from '../guard/tipoUsuario.guard';
import { ClienteService } from '../services/cliente.service';

@ApiTags('client')
@Controller('client')
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) { }

  @Post('registrar')
  @UseGuards(JwtAuthGuard, TipoUsuarioGuard)
  @SetMetadata('tipo', [TipoUsuario.SUPER_ADMINISTRADOR])
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registrar un nuevo cliente/empresa',
    description:
      'Permite el aprovisionamiento de una nueva organización en el sistema. Genera de forma automática sus credenciales y API Keys criptográficas para la integración M2M.',
  })
  @ApiBody({ type: CreateClienteDto })
  @ApiResponse({
    status: 201,
    description:
      'Cliente creado con éxito. Devuelve los datos de la entidad y la API Key original en texto plano (única vez).',
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
    status: 400,
    description:
      'Petición incorrecta. Los datos del DTO fallaron en las validaciones de estructura o tipos.',
  })
  async registrarCliente(@Body() clienteDTO: CreateClienteDto, @Res() res: Response) {
    const respuesta = await this.clienteService.registrarCliente(clienteDTO);

    const { apiKeyHash, ...clientePublico } = respuesta.cliente;

    return res.status(201).json({
      cliente: clientePublico,
      apiKey: respuesta.apiKey,
    });
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, TipoUsuarioGuard)
  @SetMetadata('tipo', [TipoUsuario.SUPER_ADMINISTRADOR])
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener lista de clientes',
    description:
      'Permite a un superadministrador obtener la lista de clientes registrados',
  })
  async getClientes(@Res() res: Response) {
    const respuesta = await this.clienteService.findAll();

    return res.status(200).json(respuesta);
  }

  @Patch('update/:id')
  @ApiOperation({
    summary: 'Actualizar datos de un cliente',
    description:
      'Permite a un superadministrador actualizar los datos de un cliente registrado',
  })
  @UseGuards(JwtAuthGuard, TipoUsuarioGuard)
  @SetMetadata('tipo', [TipoUsuario.SUPER_ADMINISTRADOR])
  @ApiBearerAuth()
  @ApiBody({ type: UpdateClienteDto })
  @ApiResponse({
    status: 200,
    description: 'Cliente actualizado con éxito. Devuelve los datos actualizados de la entidad.',
  })
  @ApiResponse({
    status: 401,
    description:
      'No autorizado. El token de acceso es inválido, expiró o no fue provisto en la cabecera.',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado. El ID proporcionado no corresponde a ningún cliente registrado.',
  })
  async updateCliente(
    @Res() res: Response,
    @Body() dto: UpdateClienteDto,
    @Param('id') id: string
  ) {
    const cliente = await this.clienteService.updateCliente(id, dto);
    return res.status(200).json(cliente);
  }
}
