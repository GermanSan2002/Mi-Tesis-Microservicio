import { IsEmail, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // 🚀 IMPORTANTE: Importamos el decorador de Swagger
import { PlanesSuscripcion } from '../entities/planes-suscripcion.enum';

export class CreateClienteDto {
  @ApiProperty({
    description: 'Nombre de la organización o empresa cliente',
    example: 'Empresa de Logística S.A.',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del cliente/empresa es requerido' })
  @Length(3, 100, { message: 'El nombre debe tener entre 3 y 100 caracteres' })
  nombre: string;

  @ApiProperty({
    description: 'Correo electrónico corporativo para el contacto principal',
    example: 'contacto@empresalogistica.com',
  })
  @IsEmail(
    {},
    { message: 'El mail de contacto debe ser un correo electrónico válido' },
  )
  @IsNotEmpty({ message: 'El mail de contacto es requerido' })
  mailContacto: string;

  @ApiProperty({
    description: 'Plan de suscripción asignado inicialmente a la organización',
    enum: PlanesSuscripcion,
    example: PlanesSuscripcion.BRONCE,
  })
  @IsEnum(PlanesSuscripcion, {
    message: `El plan debe ser uno de los siguientes valores: ${Object.values(PlanesSuscripcion).join(', ')}`,
  })
  @IsNotEmpty({ message: 'El plan de suscripción es requerido' })
  plan: PlanesSuscripcion;
}
