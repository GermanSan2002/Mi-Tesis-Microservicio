import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from 'src/entities/cliente.entity';
import { ClienteService } from 'src/services/cliente.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cliente]),
  ],
  providers: [ClienteService],
  exports: [ClienteService],
})
export class ClienteModule {}