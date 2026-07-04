import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/entities/usuario.entity'; 
import { TokenService } from 'src/services/token.service';
import { JwtModule } from '@nestjs/jwt';
import { Sesion } from 'src/entities/sesion.entity';
import { SesionModule } from './sesion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Sesion]), // Asegúrate de incluir Sesion si lo necesitas
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '1h',
      },
    }),
    SesionModule
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}