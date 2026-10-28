import { Body, Controller, Get, Post, Req, Res, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";
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
}