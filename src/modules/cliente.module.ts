import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteController } from 'src/controllers/cliente.controller';
import { Cliente } from 'src/entities/cliente.entity';
import { ClienteService } from 'src/services/cliente.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cliente]),
  ],
  providers: [ClienteService],
  controllers: [ClienteController],
  exports: [ClienteService],
})
export class ClienteModule {}