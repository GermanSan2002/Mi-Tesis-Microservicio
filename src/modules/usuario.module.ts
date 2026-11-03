import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../entities/usuario.entity';
import { UsuarioService } from '../services/usuario.service';
import { ClienteModule } from './cliente.module';
import { Rol } from '../entities/rol.entity';
import { RolModule } from './rol.module';
import { UsersController } from '../controllers/users.controller';
import { OperacionModule } from './operacion.module';
import { ParametroModule } from './parametro.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Rol]),
    ClienteModule,
    RolModule,
    OperacionModule,
    ParametroModule
  ],
  providers: [UsuarioService],
  controllers: [UsersController],
  exports: [UsuarioService],
})
export class UsuarioModule {}
