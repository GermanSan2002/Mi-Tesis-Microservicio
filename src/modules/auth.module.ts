import { Module } from '@nestjs/common';
import { TokenModule } from './token.module';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { SesionModule } from './sesion.module';
import { OperacionModule } from './operacion.module';
import { UsuarioModule } from './usuario.module';
import { ClienteModule } from './cliente.module';

@Module({
  imports: [TokenModule, SesionModule, OperacionModule, UsuarioModule, ClienteModule],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
