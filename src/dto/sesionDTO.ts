import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsString, Length } from 'class-validator';


export class CreateSesionDTO {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario propietario de la sesión',
  })
  @IsInt()
  idUsuario: string;

  @ApiProperty({
    example: '$2b$10$JrM2...',
    description: 'Hash del Refresh Token',
  })
  @IsString()
  refreshTokenHash: string;

  @ApiProperty({
    example: '2026-07-09T15:30:00.000Z',
    description: 'Fecha de expiración de la sesión',
  })
  @IsDateString()
  expiraEn?: Date;

  @ApiProperty({
    example: 'A',
    description: 'Estado de la sesión (A = Activa, I = Inactiva)',
  })
  @IsString()
  @Length(1, 1)
  estado: string;
}