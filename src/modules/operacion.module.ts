import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/entities/usuario.entity';
import { Operacion } from 'src/entities/operacion.entity';
import { OperacionService } from 'src/services/operacion.service';
import { OperationController } from 'src/controllers/operation.controller';
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
