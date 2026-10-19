import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateRolDTO {
    @ApiProperty({
        example: 'Usuario con permisos de administrador',
        description: 'Descripción del rol',
    })
    @IsString()
    @IsNotEmpty()
    descripcion: string;

    @ApiProperty({
        example: 'Administrador',
        description: 'Nombre del rol',
    })
    @IsString()
    @IsNotEmpty()
    nombre: string;
}