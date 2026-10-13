import { ApiProperty } from "@nestjs/swagger";

export class CreateRolDTO {
    @ApiProperty({
        example: 'Usuario con permisos de administrador',
        description: 'Descripción del rol',
    })
    descripcion: string;
    @ApiProperty({
        example: 'Administrador',
        description: 'Nombre del rol',
    })
    nombre: string;
}