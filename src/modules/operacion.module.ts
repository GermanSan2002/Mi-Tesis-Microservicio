import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/entities/usuario.entity';
import { Sesion } from 'src/entities/sesion.entity';
import { SesionService } from 'src/services/sesion.service';
import { Operacion } from 'src/entities/operacion.entity';
import { OperacionService } from 'src/services/operacion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Sesion, Operacion]), // Asegúrate de que 'Operacion' esté importado correctamente desde su entidad correspondiente
  ],
  providers: [OperacionService],
  exports: [OperacionService],
})
export class OperacionModule {}