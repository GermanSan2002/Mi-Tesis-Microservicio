import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/entities/usuario.entity';
import { Sesion } from 'src/entities/sesion.entity';
import { SesionService } from 'src/services/sesion.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Sesion])],
  providers: [SesionService],
  exports: [SesionService],
})
export class SesionModule {}
