import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/entities/usuario.entity';
import { TokenModule } from './token.module';
import { AuthService } from 'src/services/auth.service';
import { AuthController } from 'src/controllers/auth.controller';
import { Sesion } from 'src/entities/sesion.entity';
import { SesionModule } from './sesion.module';
import { OperacionModule } from './operacion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Sesion]),
    TokenModule,
    SesionModule,
    OperacionModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}