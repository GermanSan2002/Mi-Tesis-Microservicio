import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cliente } from '../entities/cliente.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { CreateClienteDto } from '../dto/clienteDTO';
import { EstadosEntidades } from '../entities/estadosEntidades';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class ClienteService {
  constructor(
    @Inject(CACHE_MANAGER) 
    private cacheManager: Cache,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    private readonly dataSource: DataSource,
  ) {}

  private getRepository(manager?: EntityManager): Repository<Cliente> {
    return manager ? manager.getRepository(Cliente) : this.clienteRepository;
  }

  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  async findAll(
    manager?: EntityManager,
  ){
    const repo = this.getRepository(manager);
    return await repo.find();
  }

  async findClienteById(
    idCliente: string,
    manager?: EntityManager,
  ): Promise<Cliente | null> {
    const repo = this.getRepository(manager);
    return repo.findOne({ where: { idCliente: idCliente } });
  }

  async registrarCliente(
    dto: CreateClienteDto,
  ): Promise<{ cliente: Cliente; apiKey: string }> {
    // Generar la API Key segura y aleatoria
    const apiKeyOriginal = `sk_${crypto.randomBytes(32).toString('hex')}`;

    // Hashear la API Key antes de guardarla
    const apiKeyHash = this.hashApiKey(apiKeyOriginal);

    // Se crea cliente
    const nuevoCliente = this.clienteRepository.create({
      nombre: dto.nombre,
      mailContacto: dto.mailContacto,
      plan: dto.plan,
      estado: EstadosEntidades.ALTA, // 'A' de Activo por defecto al registrar
      apiKeyHash,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const cliente = await queryRunner.manager.save(Cliente, nuevoCliente);

      await queryRunner.commitTransaction();

      return {
        cliente: cliente,
        apiKey: apiKeyOriginal,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException('Could not register client');
    } finally {
      await queryRunner.release();
    }
  }

  async validateApiKey(apiKeyProvista: string): Promise<Cliente | null> {
    const hashTarget = this.hashApiKey(apiKeyProvista);
    const cacheKey = `api_key_validada_${hashTarget}`;

    const cachedData = await this.cacheManager.get<Cliente>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Traemos también el idCliente (UUID) para inyectarlo en el Request
    const cliente = await this.clienteRepository.findOne({
      where: { apiKeyHash: hashTarget },
      select: ['idCliente', 'nombre', 'estado'],
    });

    if (!cliente || cliente.estado !== 'A') {
      return null;
    }

    await this.cacheManager.set(cacheKey, cliente, 300000);

    return cliente;
  }
}
