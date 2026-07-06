import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Cliente } from "src/entities/cliente.entity";
import { EntityManager, Repository } from "typeorm";

@Injectable()
export class ClienteService {
    constructor(
        @InjectRepository(Cliente)
        private readonly clienteRepository: Repository<Cliente>,
      ) {}

    private getRepository(manager?: EntityManager): Repository<Cliente> {
        return manager ? manager.getRepository(Cliente) : this.clienteRepository;
    }

    async findClienteById(idCliente: string, manager?: EntityManager): Promise<Cliente|null> {
        const repo = this.getRepository(manager);
        return repo.findOne({ where: { idCliente: idCliente } });
    }
}