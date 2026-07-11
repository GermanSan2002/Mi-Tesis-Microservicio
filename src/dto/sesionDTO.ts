import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsString, Length } from 'class-validator';
import { EstadosSesion } from 'src/entities/estadosSesiones.enum';

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
    example: EstadosSesion.ACTIVA,
    enum: EstadosSesion,
    description: 'Estado de la sesión (A = Activa, I = Inactiva, E = Expirada)',
  })
  @IsEnum(EstadosSesion, {
    message: `El plan debe ser uno de los siguientes valores: ${Object.values(EstadosSesion).join(', ')}`,
  })
  estado: EstadosSesion;
}
