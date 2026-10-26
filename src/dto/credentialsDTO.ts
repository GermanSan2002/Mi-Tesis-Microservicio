import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CredentialsDTO {
  @ApiProperty({
    example: 'correo@gmail.com',
    description: 'The email address of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'pass1234',
    description: 'The password of the user',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}
