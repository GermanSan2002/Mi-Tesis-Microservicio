import { Body, Controller, Get, Param, Patch, Post, Req, Res, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { CreateRolDTO } from "../dto/rolDTO";
import { ApiKeyGuard } from "../guard/apiKeyGuard";
import { RolService } from "../services/rol.service";
import type { Response } from 'express';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@ApiTags('roles')
@Controller('roles')
export class RolController {
    constructor(private readonly rolService: RolService) {}

    @Get('get-roles')
    @UseGuards(ApiKeyGuard)
    @ApiSecurity('X-API-KEY')
    @ApiHeader({
        name: 'X-API-Key',
        description: 'Clave secreta proporcionada al cliente',
        required: false,
    })
    async getRoles(@Req() req: any, @Res() res: Response) {
        const idCliente = req.idCliente;
        const roles = await this.rolService.findRolesByClienteId(idCliente);
        return res.status(200).json(roles);
    }

    @Post('crear-rol')
    @UseGuards(ApiKeyGuard)
    @ApiOperation({
        summary: 'Registrar registrar un rol desde la API (M2M)',
        description:
          'Permite a un cliente añadir un rol a su organización usando su API Key corporativa.',
    })
    @ApiSecurity('X-API-KEY')
    @ApiHeader({
        name: 'X-API-Key',
        description: 'Clave secreta proporcionada al cliente',
        required: false,
    })
    async registerRol(
        @Req() req: any,
        @Body() rolDTO: CreateRolDTO,
        @Res() res: Response
    ){
        const cliente = req.cliente;
        const newRol = await this.rolService.createRol(rolDTO, cliente);
        return res.status(201).json(newRol);
    }

    @Patch('alta/:id')
    @UseGuards(ApiKeyGuard)
    @ApiOperation({
        summary: 'Dar de alta un rol desde la API (M2M)',
        description:
          'Permite a un cliente dar de alta un rol a su organización usando su API Key corporativa.',
    })
    @ApiSecurity('X-API-KEY')
    @ApiHeader({
        name: 'X-API-Key',
        description: 'Clave secreta proporcionada al cliente',
        required: false,
    })
    async altaRol(
        @Req() req: any,
        @Param('id') id: string,
        @Res() res: Response
    ){
        const idCliente = req.idCliente;
        const updatedRol = await this.rolService.altaRol(id, idCliente) ;
        return res.status(200).json(updatedRol);
    }

    @Patch('baja/:id')
    @UseGuards(ApiKeyGuard)
    @ApiOperation({
        summary: 'Dar de baja un rol desde la API (M2M)',
        description:
          'Permite a un cliente dar de baja un rol de su organización usando su API Key corporativa.',
    })
    @ApiSecurity('X-API-KEY')
    @ApiHeader({
        name: 'X-API-Key',
        description: 'Clave secreta proporcionada al cliente',
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: 'Rol dado de baja exitosamente.'
    })
    @ApiResponse({
        status: 404,
        description: 'Rol no encontrado.',
    }) 
    async bajaRol(
        @Req() req: any,
        @Param('id') id: string,
        @Res() res: Response
    ){
        const idCliente = req.idCliente;
        const updatedRol = await this.rolService.bajaRol(id, idCliente);
        return res.status(200).json(updatedRol);
    }
}