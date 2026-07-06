import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateOperacionDTO } from "src/dto/operacionDTO";
import { Operacion } from "src/entities/operacion.entity";
import { Usuario } from "src/entities/usuario.entity";
import { Repository } from "typeorm";
import { EntityManager } from 'typeorm';

@Injectable()
export class OperacionService {
    constructor(
        @InjectRepository(Operacion)
        private readonly operacionRepository: Repository<Operacion>,
    ) {}

    async create(createOperacionDTO: CreateOperacionDTO, manager?: EntityManager): Promise<Operacion> {
        const operacion = this.operacionRepository.create({
          ...createOperacionDTO,
          usuario: { idUsuario: createOperacionDTO.idUsuario } as Usuario,
        });

        if (manager) {
          return await manager.save(Operacion, operacion);
        }
    
        return await this.operacionRepository.save(operacion);
      }
}