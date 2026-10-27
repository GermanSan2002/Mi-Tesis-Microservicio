import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSourceConfig } from './database/data.source';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { Operacion } from './entities/operacion.entity';
import { Rol } from './entities/rol.entity';
import { Sesion } from './entities/sesion.entity';
import { Usuario } from './entities/usuario.entity';
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
import { ClienteController } from './controllers/cliente.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({ ...DataSourceConfig }),
    TypeOrmModule.forFeature([Cliente, Usuario, Sesion, Rol, Operacion]),
    CacheModule.registerAsync({
      isGlobal: true, // Disponible en todos los módulos de la app
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
          },
          ttl: 60 * 1000,
        }),
      }),
    }),
    TokenModule,
    AuthModule,
    SesionModule,
    OperacionModule,
    UsuarioModule,
    ClienteModule,
    RolModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UsersController,
    ClienteController,
  ],
  providers: [
    AppService,
    AuthService,
    SesionService,
    OperacionService,
    UsuarioService,
    ClienteService,
    RolService,
  ],
})
export class AppModule {}
