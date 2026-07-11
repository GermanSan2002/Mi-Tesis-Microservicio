import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class BajaAltaDTO {
    @ApiProperty({
        description: 'Motivo para dar la baja',
        example: 'Usuario solicita la baja'
    })
    @IsString()
    motivo: string;
}