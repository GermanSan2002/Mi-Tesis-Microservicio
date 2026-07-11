import { ApiProperty } from '@nestjs/swagger';

export class CredentialsDTO {
  @ApiProperty({
    example: 'correo@gmail.com',
    description: 'The email address of the user',
  })
  email: string;

  @ApiProperty({
    example: 'pass1234',
    description: 'The password of the user',
  })
  password: string;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}
