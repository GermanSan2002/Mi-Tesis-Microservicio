import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRolDTO } from '../dto/rolDTO';
import { EstadosEntidades } from '../entities/estadosEntidades';
import { Rol } from '../entities/rol.entity';
import { EntityManager, Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { Cliente } from 'src/entities/cliente.entity';

@Injectable()
export class RolService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    private readonly dataSource: DataSource,
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

  async getRolesByClienteId(
    idCliente: string,
    manager?: EntityManager,
  ): Promise<Rol[]> {
    const repo = this.getRepository(manager);
    return repo.find({ where: { cliente: { idCliente } } });
  }

  async createRol(
    rolData: CreateRolDTO,
    cliente: Cliente
  ): Promise<Rol> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newRol = this.rolRepository.create({
        descripcion: rolData.descripcion,
        nombre: rolData.nombre,
        estado: EstadosEntidades.ALTA,
        cliente: cliente,
      });

      console.log(newRol);
      console.log(cliente.idCliente);
      
      await this.rolRepository.save(newRol);
      await queryRunner.commitTransaction();
      
      return newRol;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
