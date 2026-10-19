import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolController } from '../controllers/roles.controller';
import { Rol } from '../entities/rol.entity';
import { RolService } from '../services/rol.service';
import { ClienteModule } from './cliente.module';

@Module({
  imports: [
    ClienteModule, 
    TypeOrmModule.forFeature([Rol])
  ],
  providers: [RolService],
  exports: [RolService],
  controllers: [RolController],
})
export class RolModule {}
