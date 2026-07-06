import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from 'src/entities/rol.entity';
import { RolService } from 'src/services/rol.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rol]),
  ],
  providers: [RolService],
  exports: [RolService],
})
export class RolModule {}