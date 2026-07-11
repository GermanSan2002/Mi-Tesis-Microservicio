import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoUsuario } from 'src/entities/tipo-usuario.enum';
import { EstadosEntidades } from 'src/entities/estadosEntidades';

export class CreateUsuarioDTO {
  @ApiProperty({
    example: 'Password123!',
    description: 'Contraseña del usuario (se almacenará encriptada)',
  })
  @IsString()
  contraseña: string;

  @ApiProperty({
    example: 'usuario@empresa.com',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail()
  correo: string;

  @ApiPropertyOptional({
    example: {
      telefono: '1122334455',
      cargo: 'Administrador',
    },
    description: 'Parámetros adicionales del usuario',
  })
  @IsOptional()
  @IsObject()
  parametros?: any;

  @ApiPropertyOptional({
    example: ['ADM001', 'VENDEDOR'],
    description: 'IDs de los roles asignados al usuario',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}

export class ModifyUsuarioDTO {
  @ApiProperty({
    example: 'Password123!',
    description: 'Contraseña del usuario (se almacenará encriptada)',
  })
  @IsString()
  contraseña: string;

  @ApiProperty({
    example: 'usuario@empresa.com',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail()
  correo: string;

  @ApiProperty({
    example: 'A',
    enum: EstadosEntidades,
    description: 'Estado del usuario (A = Alta, B = Baja)',
  })
  @IsEnum(EstadosEntidades)
  estado: EstadosEntidades;

  @ApiPropertyOptional({
    example: {
      telefono: '1122334455',
      cargo: 'Administrador',
    },
    description: 'Parámetros adicionales del usuario',
  })
  @IsOptional()
  @IsObject()
  parametros?: any;

  @ApiProperty({
    enum: TipoUsuario,
    example: TipoUsuario.ADMINISTRADOR_CLIENTE,
    description: 'Tipo de usuario',
  })
  @IsEnum(TipoUsuario)
  tipo: TipoUsuario;

  @ApiPropertyOptional({
    example: false,
    description: 'Indica si el usuario verificó su cuenta',
  })
  @IsOptional()
  @IsBoolean()
  verificado?: boolean;

  @ApiProperty({
    example: 1,
    description: 'ID del cliente al que pertenece el usuario',
  })
  @IsString()
  idCliente: string;

  @ApiPropertyOptional({
    example: ['ADM001', 'VENDEDOR'],
    description: 'IDs de los roles asignados al usuario',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}
