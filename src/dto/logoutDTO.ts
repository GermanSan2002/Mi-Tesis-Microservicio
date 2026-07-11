import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LogoutDTO {
  @ApiProperty({
    description: 'Refresh Token de la sesión a cerrar',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken: string;
}
