import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateRolDTO } from "../dto/rolDTO";
import { ApiKeyGuard } from "../guard/apiKeyGuard";
import { RolService } from "../services/rol.service";
import type { Response } from 'express';

@ApiTags('roles')
@Controller('roles')
export class RolController {
    constructor(private readonly rolService: RolService) {}

    @Get('get-roles')
    @UseGuards(ApiKeyGuard)
    async getRoles(@Req() req: any, @Res() res: Response) {
        const idCliente = req.idCliente;
        const roles = await this.rolService.getRolesByClienteId(idCliente);
        return res.status(200).json(roles);
    }

    @Post('crear-rol')
    @UseGuards(ApiKeyGuard)
    @ApiOperation({
        summary: 'Registrar registrar un rol desde la API (M2M)',
        description:
          'Permite a un cliente añadir un rol a su organización usando su API Key corporativa.',
    })
    @ApiHeader({
        name: 'X-API-Key',
        description: 'Clave secreta proporcionada al cliente',
        required: true,
    })
    async registerRol(
        @Req() req: any,
        @Body() rolDTO: CreateRolDTO,
        @Res() res: Response
    ){
        const idCliente = req.idCliente;
        const newRol = await this.rolService.createRol(rolDTO);
        return res.status(201).json(newRol);
    }
}