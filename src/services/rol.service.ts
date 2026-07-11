import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rol } from 'src/entities/rol.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class RolService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<Rol> {
    return manager ? manager.getRepository(Rol) : this.rolRepository;
  }

  async findRolesByClienteId(
    idCliente: string,
    manager?: EntityManager,
  ): Promise<Rol[]> {
    const repo = this.getRepository(manager);
    return repo.find({ where: { cliente: { idCliente } } });
  }
}
