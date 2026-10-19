import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../entities/usuario.entity';
import { Sesion } from '../entities/sesion.entity';
import { SesionService } from '../services/sesion.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Sesion])],
  providers: [SesionService],
  exports: [SesionService],
})
export class SesionModule {}
