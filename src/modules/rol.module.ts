import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolController } from 'src/controllers/roles.controller';
import { Rol } from 'src/entities/rol.entity';
import { RolService } from 'src/services/rol.service';
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
