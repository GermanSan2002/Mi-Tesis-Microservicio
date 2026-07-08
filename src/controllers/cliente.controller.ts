import { Body, Controller, Get, Post, SetMetadata, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateClienteDto } from "src/dto/clienteDTO";
import { TipoUsuario } from "src/entities/tipo-usuario.enum";
import { JwtAuthGuard } from "src/guard/jwt-auth.guard";
import { TipoUsuarioGuard } from "src/guard/tipoUsuario.guard";
import { ClienteService } from "src/services/cliente.service";

@ApiTags('client')
@Controller('client')
export class ClienteController {
    constructor(
        private readonly clienteService: ClienteService,
    ) {}
    
    @Post('registrar/admin')
    @UseGuards(JwtAuthGuard, TipoUsuarioGuard)
    @SetMetadata('tipo', [TipoUsuario.SUPER_ADMINISTRADOR])
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Registrar un nuevo cliente/empresa', 
        description: 'Permite el aprovisionamiento de una nueva organización en el sistema. Genera de forma automática sus credenciales y API Keys criptográficas para la integración M2M.' 
    })
    @ApiBody({ type: CreateClienteDto })
    @ApiResponse({ 
        status: 201, 
        description: 'Cliente creado con éxito. Devuelve los datos de la entidad y la API Key original en texto plano (única vez).',
    })
    @ApiResponse({ 
        status: 401, 
        description: 'No autorizado. El token de acceso es inválido, expiró o no fue provisto en la cabecera.' 
    })
    @ApiResponse({ 
        status: 403, 
        description: 'Prohibido. El tipo de usuario logueado no posee los privilegios suficientes para ejecutar esta operación.' 
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Petición incorrecta. Los datos del DTO fallaron en las validaciones de estructura o tipos.' 
    })
    async registrarCliente(@Body() clienteDTO: CreateClienteDto) {
        return this.clienteService.registrarCliente(clienteDTO);
    }
}