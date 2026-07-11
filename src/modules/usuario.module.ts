import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/entities/usuario.entity';
import { UsuarioService } from 'src/services/usuario.service';
import { ClienteModule } from './cliente.module';
import { Rol } from 'src/entities/rol.entity';
import { RolModule } from './rol.module';
import { UsersController } from 'src/controllers/users.controller';
import { OperacionModule } from './operacion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Rol]),
    ClienteModule,
    RolModule,
    OperacionModule,
  ],
  providers: [UsuarioService],
  controllers: [UsersController],
  exports: [UsuarioService],
})
export class UsuarioModule {}
