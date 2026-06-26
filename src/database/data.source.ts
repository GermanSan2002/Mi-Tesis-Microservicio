import { ConfigModule, ConfigService } from '@nestjs/config';
import { Cliente } from 'src/entities/cliente.entity';
import { Operacion } from 'src/entities/operacion.entity';
import { Rol } from 'src/entities/rol.entity';
import { Sesion } from 'src/entities/sesion.entity';
import { Usuario } from 'src/entities/usuario.entity';
import { DataSource, DataSourceOptions } from 'typeorm';

ConfigModule.forRoot({
  envFilePath: ['.env'],
});

const configService = new ConfigService();

export const DataSourceConfig: DataSourceOptions = {
  type: 'mysql',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_DATABASE'),
  entities: [Cliente, Usuario, Sesion, Rol, Operacion],
  synchronize: true,
};

export const AppDS = new DataSource(DataSourceConfig);