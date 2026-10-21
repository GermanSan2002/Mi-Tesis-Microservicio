import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiProperty, ApiPropertyOptional, ApiQuery, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { TipoOperacion } from "../entities/tipo-operacion.enum";
import { ApiKeyGuard } from "../guard/apiKeyGuard";
import { OperacionService } from "../services/operacion.service";

export class PaginatedOperationQuery {
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
        enum: TipoOperacion,
        description: 'Tipo de operación para filtrar (opcional)',
    })
    @IsEnum(TipoOperacion)
    @IsOptional()
    tipo?: TipoOperacion;

    @ApiPropertyOptional({
        description: 'Fecha de realización de la operación para filtrar (opcional)',
        example: '2026-07-02T15:30:00.000Z',
    })
    @IsOptional()
    @IsDate()
    fechaRealizacion?: Date;

    @ApiPropertyOptional({
        description: 'Fecha después de la cual filtrar las operaciones (opcional)',
        example: '2026-07-02T15:30:00.000Z',
    })
    @IsOptional()
    @IsDate()
    despueDe?: Date;

    @ApiPropertyOptional({
        description: 'Fecha antes de la cual filtrar las operaciones (opcional)',
        example: '2026-07-02T15:30:00.000Z',
    })
    @IsOptional()
    @IsDate()
    antesDe?: Date;
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
    @ApiSecurity('X-API-KEY')
    @ApiHeader({
        name: 'X-API-Key',
        description: 'Clave secreta proporcionada al cliente',
        required: false,
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
            query
        );
    }
}