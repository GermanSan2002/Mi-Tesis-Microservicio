import { Body, Controller, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateUsuarioDTO } from "src/dto/usuarioDTO";
import { Usuario } from "src/entities/usuario.entity";
import { UsuarioService } from "src/services/usuario.service";

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(
        private readonly usuarioService: UsuarioService,
    ) {}

    @Post(':idCliente/registrar')
    @ApiOperation({
        summary: 'Registrar un usuario para un cliente',
    })
    @ApiParam({
        name: 'idCliente',
        description: 'ID del cliente',
        example: 'CLI-001',
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
    async registerUserCliente(@Param('idCliente') idCliente: string, @Body() usuarioDTO: CreateUsuarioDTO,): Promise<Usuario> {
        return await this.usuarioService.registerUserCliente(usuarioDTO, idCliente);
    }

    @Patch(':idCliente/usuarios/:idUsuario/verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Verificar un usuario asociado a un cliente específico',
        description: 'Cambia el estado del usuario a verificado y activo, registrando la auditoría de forma transaccional.',
    })
    @ApiParam({
        name: 'idCliente',
        description: 'ID del cliente propietario del usuario',
        type: Number,
        example: 1,
    })
    @ApiParam({
        name: 'idUsuario',
        description: 'ID del usuario a verificar',
        type: Number,
        example: 42,
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
        @Param('idCliente') idCliente: string,
        @Param('idUsuario') idUsuario: string,
    ): Promise<void> {
        return await this.usuarioService.verifyUserCliente(idCliente, idUsuario);
    }
}