import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../entities/usuario.entity';
import { Operacion } from '../entities/operacion.entity';
import { OperacionService } from '../services/operacion.service';
import { OperationController } from '../controllers/operation.controller';
import { ClienteModule } from './cliente.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Operacion]),
    ClienteModule,
  ],
  providers: [OperacionService],
  controllers: [OperationController],
  exports: [OperacionService],
})
export class OperacionModule {}
