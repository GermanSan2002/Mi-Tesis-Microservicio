import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiProperty, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { TipoOperacion } from "src/entities/tipo-operacion.enum";
import { ApiKeyGuard } from "src/guard/apiKeyGuard";
import { OperacionService } from "src/services/operacion.service";

class PaginatedOperationQuery {
    @ApiProperty({
        description: 'Número de página para la paginación',
        example: 1,
    })
    @IsOptional()
    page?: number;

    @ApiProperty({
        description: 'Número de elementos por página',
        example: 10,
    })
    @IsOptional()
    limit?: number;

    @ApiProperty({
        enum: TipoOperacion,
        description: 'Tipo de operación para filtrar (opcional)',
    })
    @IsEnum(TipoOperacion)
    @IsOptional()
    tipo?: TipoOperacion;
}

@ApiTags('operations')
@Controller('operations')
export class OperationController {
    constructor(private readonly operacionService: OperacionService) { }

    @Get(':idUsuario')
    @UseGuards(ApiKeyGuard)
    @ApiOperation({
        summary: 'Obtener operaciones de un usuario por su ID',
        description:
            'Permite a un cliente obtener las operaciones asociadas a un usuario específico dentro de su organización usando su API Key corporativa.',
    })
    @ApiHeader({
        name: 'X-API-Key',
        description: 'Clave secreta proporcionada al cliente',
        required: true,
    })
    @ApiParam({
        name: 'idUsuario',
        description: 'ID del usuario',
        type: String,
        example: 'User_01',
    })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'tipo', required: false, enum: TipoOperacion })
    @ApiBody({
        description: 'Parámetros de paginación y filtro opcionales',
        type: PaginatedOperationQuery,
    })
    @ApiResponse({
        status: 200,
        description: 'Operaciones obtenidas exitosamente.',
    })
    @ApiResponse({
        status: 404,
        description: 'Cliente o Usuario no encontrado.',
    })
    @ApiResponse({
        status: 500,
        description: 'Error interno del servidor.',
    })
    async getOperacionesByUsuarioId(
        @Req() req: any,
        @Param('idUsuario') idUsuario: string,
        @Query() query: PaginatedOperationQuery,
    ) {
        const idCliente = req.idCliente;

        return await this.operacionService.getOperacionesByUsuarioId(
            idUsuario,
            idCliente,
            query.page || 1,
            query.limit || 10,
            query.tipo,
        );
    }
}