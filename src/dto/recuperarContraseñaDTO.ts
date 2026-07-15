import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class RecuperarContraseñaSolicitudDTO {
    @ApiProperty({
        description: "Correo del usuario a recuperar",
        example: "user@gmail.com"
    })
    @IsString()
    @IsEmail()
    correo: string
}

export class CambiarContraseñaDTO {
    @ApiProperty({
        description: "Contraseña nueva para el usuario",
        example: "user@gmail.com"
    })
    @IsString()
    contraseña: string
}