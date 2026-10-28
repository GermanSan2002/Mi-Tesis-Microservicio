import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRolDTO } from '../dto/rolDTO';
import { EstadosEntidades } from '../entities/estadosEntidades';
import { Rol } from '../entities/rol.entity';
import { EntityManager, Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { Cliente } from 'src/entities/cliente.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RolService {
  constructor(
    @Inject(CACHE_MANAGER) 
    private cacheManager: Cache,
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
    const cacheKey = `roles_cliente_${idCliente}`
    
    const cachedData = await this.cacheManager.get<Rol[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const repo = this.getRepository(manager);
    const roles = await repo.find({ where: { idCliente: idCliente } });
    await this.cacheManager.set(cacheKey, roles, 300000);

    return roles;
  }

  async findRolesByRolAndClienteId(
    idRol: string,
    idCliente: string,
    manager?: EntityManager,
  ): Promise<Rol | null> {
    const repo = this.getRepository(manager);
    return repo.findOne({ where: { idRol: idRol,idCliente: idCliente } });
  }

  async getRolesByClienteId(
    idCliente: string,
    manager?: EntityManager,
  ): Promise<Rol[]> {
    const repo = this.getRepository(manager);
    return await repo.find({ where: { idCliente: idCliente } });
  }

  async createRol(
    rolData: CreateRolDTO,
    cliente: Cliente
  ): Promise<Rol> {
    const cacheKey = `roles_cliente_${cliente.idCliente}`

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repo = queryRunner.manager.getRepository(Rol);

      const newRol = repo.create({
        descripcion: rolData.descripcion,
        nombre: rolData.nombre,
        estado: EstadosEntidades.ALTA,
        cliente: cliente,
      });
      
      await repo.save(newRol);
      await queryRunner.commitTransaction();
    
      this.cacheManager.del(cacheKey);
      
      return newRol;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
