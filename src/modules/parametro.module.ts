import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parametro } from '../entities/parametro.entity';
import { ParametroService } from '../services/parametro.service';
import { ParametroController } from 'src/controllers/parametro.controller';
import { ClienteModule } from './cliente.module';

@Module({
  imports: [TypeOrmModule.forFeature([Parametro]),
    ClienteModule
  ],
  providers: [ParametroService],
  controllers: [ParametroController],
  exports: [ParametroService],
})
export class ParametroModule {}