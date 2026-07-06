import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
} from 'class-validator';

import { TipoOperacion } from 'src/entities/tipo-operacion.enum';

export class CreateOperacionDTO {
  @ApiProperty({
    example: '2026-07-02T15:30:00.000Z',
    description: 'Fecha y hora en la que se realizó la operación',
  })
  @IsDateString()
  fechaRealizacion: Date;

  @ApiPropertyOptional({
    example: {
      ip: '192.168.1.10',
      navegador: 'Chrome',
      observacion: 'Inicio de sesión exitoso',
    },
    description: 'Información adicional de la operación',
  })
  @IsOptional()
  @IsObject()
  metadatos?: Record<string, unknown>;

  @ApiProperty({
    enum: TipoOperacion,
    description: 'Tipo de operación realizada',
  })
  @IsEnum(TipoOperacion)
  tipo: TipoOperacion;

  @ApiProperty({
    example: 1,
    description: 'ID del usuario que realizó la operación',
  })
  @IsInt()
  idUsuario: string;
}