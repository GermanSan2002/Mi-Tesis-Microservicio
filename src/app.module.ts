import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DataSourceConfig } from './database/data.source';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from 'src/entities/cliente.entity';
import { Operacion } from 'src/entities/operacion.entity';
import { Rol } from 'src/entities/rol.entity';
import { Sesion } from 'src/entities/sesion.entity';
import { Usuario } from 'src/entities/usuario.entity';
import { TokenModule } from './modules/token.module';
import { AuthModule } from './modules/auth.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { SesionModule } from './modules/sesion.module';
import { SesionService } from './services/sesion.service';
import { OperacionModule } from './modules/operacion.module';
import { OperacionService } from './services/operacion.service';
import { UsuarioModule } from './modules/usuario.module';
import { UsuarioService } from './services/usuario.service';
import { ClienteModule } from './modules/cliente.module';
import { ClienteService } from './services/cliente.service';
import { RolService } from './services/rol.service';
import { RolModule } from './modules/rol.module';
import { UsersController } from './controllers/users.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({ ...DataSourceConfig }),
    TypeOrmModule.forFeature([Cliente, Usuario, Sesion, Rol, Operacion]),
    TokenModule,
    AuthModule,
    SesionModule,
    OperacionModule,
    UsuarioModule,
    ClienteModule,
    RolModule
  ],
  controllers: [AppController, AuthController, UsersController],
  providers: [
    AppService, 
    AuthService, 
    SesionService, 
    OperacionService, 
    UsuarioService, 
    ClienteService,
    RolService
  ],
})
export class AppModule {}
