import { Body, Controller, Get, Param, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { ParametroService } from "../services/parametro.service";
import { ApiKeyGuard } from "../guard/apiKeyGuard";
import type { Response } from 'express';
import { CreateParametroDto, UpdateParametroDto } from "../dto/parametroDTO";

@ApiTags('parameters')
@Controller('parameters')
export class ParametroController {
    constructor(private readonly parametroService: ParametroService) { }

    @Get()
    @UseGuards(ApiKeyGuard)
    @ApiOperation({ summary: 'Obtener parametros de un cliente' })
    @ApiSecurity('X-API-KEY')
    @ApiHeader({
        name: 'X-API-Key',
        description: 'Clave secreta proporcionada al cliente',
        required: false,
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Parametros encontrados' 
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Api Key Invalida' 
    })
    async getParametrosCliente(
        @Req() req: any,
        @Res() res: Response
    ) {
        const idCliente = req.idCliente;

        const respuesta = await this.parametroService.obtenerParametrosPorCliente(idCliente);

        res.status(200).json(respuesta);
    }

    @Post('crear')
    @UseGuards(ApiKeyGuard)
    @ApiOperation({ summary: 'Crear parametro para un cliente' })
    @ApiSecurity('X-API-KEY')
    @ApiHeader({
        name: 'X-API-Key',
        description: 'Clave secreta proporcionada al cliente',
        required: false,
    })
    @ApiBody({ type: CreateParametroDto })
    @ApiResponse({ 
        status: 201, 
        description: 'Parametro creado' 
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Api Key Invalida' 
    })
    async crearParametro(
        @Req() req: any,
        @Body() dto: CreateParametroDto,
        @Res() res: Response
    ){
        const idCliente = req.idCliente;

        const respuesta = await this.parametroService.createParametro(dto, idCliente);

        res.status(201).json(respuesta);
    }

    @Patch('alta/:idParametro')
    @UseGuards(ApiKeyGuard)
    @ApiOperation({ summary: 'Dar de alta un parametro' })
    @ApiSecurity('X-API-KEY')
    @ApiHeader({
        name: 'X-API-Key',
        description: 'Clave secreta proporcionada al cliente',
        required: false,
    })
    @ApiParam({
        name: 'idParametro',
        description: 'ID del parametro',
        type: String,
        example: 'User_01',
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Parametro dado de alta' 
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Api Key Invalida' 
    })
    async darAltaParametro(
        @Req() req: any,
        @Param('idParametro') idParametro: string,
        @Res() res: Response
    ){
        const idCliente = req.idCliente;

        const respuesta = await this.parametroService.darAltaParametro(idParametro, idCliente);

        res.status(200).json(respuesta);
    }

    @Patch('baja/:idParametro')
    @UseGuards(ApiKeyGuard)
    @ApiOperation({ summary: 'Dar de baja un parametro' })
    @ApiSecurity('X-API-KEY')
    @ApiHeader({
        name: 'X-API-Key',
        description: 'Clave secreta proporcionada al cliente',
        required: false,
    })
    @ApiParam({
        name: 'idParametro',
        description: 'ID del parametro',
        type: String,
        example: 'User_01',
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Parametro dado de baja' 
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Api Key Invalida' 
    })
    async darBajaParametro(
        @Req() req: any,
        @Param('idParametro') idParametro: string,
        @Res() res: Response
    ){
        const idCliente = req.idCliente;

        const respuesta = await this.parametroService.darBajaParametro(idParametro, idCliente);

        res.status(200).json(respuesta);
    }

    @Patch('update/:idParametro')
    @UseGuards(ApiKeyGuard)
    @ApiOperation({ summary: 'Actualizar un parametro' })
    @ApiSecurity('X-API-KEY')
    @ApiHeader({
        name: 'X-API-Key',
        description: 'Clave secreta proporcionada al cliente',
        required: false,
    })
    @ApiParam({
        name: 'idParametro',
        description: 'ID del parametro',
        type: String,
        example: 'User_01',
    })
    @ApiBody({ type: UpdateParametroDto })
    @ApiResponse({ 
        status: 200, 
        description: 'Parametro actualizado' 
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Api Key Invalida' 
    })
    async modificarParametro(
        @Req() req: any,
        @Param('idParametro') idParametro: string,
        @Body() dto: UpdateParametroDto,
        @Res() res: Response
    ){
        const idCliente = req.idCliente;

        const respuesta = await this.parametroService.modificarParametro(dto, idCliente, idParametro);

        res.status(200).json(respuesta);
    }
}