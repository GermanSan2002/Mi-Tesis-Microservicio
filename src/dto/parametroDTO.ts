import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  IsNumber,
  Matches,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoParametro } from '../entities/tipo-parametro.enum';

export class CreateParametroDto {
  @ApiProperty({
    description: 'Nombre único del parámetro para la empresa (snake_case recomendado)',
    example: 'limite_diario_compras',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del parámetro es requerido' })
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  @Matches(/^[a-z0-9_]+$/, {
    message: 'El nombre del parámetro solo debe contener letras minúsculas, números y guiones bajos',
  })
  nombre: string;

  @ApiProperty({
    enum: TipoParametro,
    description: 'Tipo conceptual de dato admitido para el parámetro',
    example: TipoParametro.NUMBER,
  })
  @IsEnum(TipoParametro, {
    message: `El tipo debe ser uno de los siguientes: ${Object.values(TipoParametro).join(', ')}`,
  })
  @IsNotEmpty({ message: 'El tipo de parámetro es requerido' })
  tipo: TipoParametro;

  @ApiPropertyOptional({
    description: 'Valor asignado por defecto cuando el usuario no define uno propio',
    example: 50000,
  })
  @IsOptional()
  valorPorDefecto?: any;

  @ApiPropertyOptional({
    description: 'Límite inferior admitido (Aplica a number, integer y date)',
    example: 1000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El valor mínimo debe ser un número válido' })
  valorMinimo?: number;

  @ApiPropertyOptional({
    description: 'Límite superior admitido (Aplica a number, integer y date)',
    example: 100000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El valor máximo debe ser un número válido' })
  valorMaximo?: number;

  @ApiPropertyOptional({
    description: 'Descripción operativa del propósito o regla de negocio del parámetro',
    example: 'Límite máximo permitido de gasto diario por usuario',
  })
  @IsOptional()
  @IsString()
  @Length(0, 255, { message: 'La descripción no puede superar los 255 caracteres' })
  descripcion?: string;
}

export class UpdateParametroDto {
  @ApiPropertyOptional({
    enum: TipoParametro,
    description: 'Tipo conceptual de dato (Requiere validación de compatibilidad previa)',
    example: TipoParametro.NUMBER,
  })
  @IsOptional()
  @IsEnum(TipoParametro)
  tipo?: TipoParametro;

  @ApiPropertyOptional({
    description: 'Nuevo valor por defecto para los usuarios que no personalizaron el parámetro',
    example: 60000,
  })
  @IsOptional()
  valorPorDefecto?: any;

  @ApiPropertyOptional({
    description: 'Nuevo límite inferior admitido',
    example: 2000,
  })
  @IsOptional()
  @IsNumber()
  valorMinimo?: number;

  @ApiPropertyOptional({
    description: 'Nuevo límite superior admitido',
    example: 120000,
  })
  @IsOptional()
  @IsNumber()
  valorMaximo?: number;

  @ApiPropertyOptional({
    description: 'Descripción actualizada del parámetro',
    example: 'Límite máximo actualizado de gasto diario por usuario',
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  descripcion?: string;
}

export class UpdateUsuarioParametrosDto {
  @ApiProperty({
    description: 'Objeto clave-valor con los parámetros personalizados del usuario',
    example: {
      limite_diario: 75000,
      cantidad_compras: 15,
    },
  })
  @IsObject({ message: 'Los parámetros deben ser un objeto JSON clave-valor' })
  @IsNotEmpty({ message: 'El objeto de parámetros no puede estar vacío' })
  parametros: Record<string, any>;
}