import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cliente } from 'src/entities/cliente.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { CreateClienteDto } from 'src/dto/clienteDTO';
import { EstadosEntidades } from 'src/entities/estadosEntidades';

@Injectable()
export class ClienteService {
  constructor(
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
    // Calculamos el hash determinista de la clave provista
    const hashTarget = this.hashApiKey(apiKeyProvista);

    // Traemos también el idCliente (UUID) para inyectarlo en el Request
    const cliente = await this.clienteRepository.findOne({
      where: { apiKeyHash: hashTarget },
      select: ['idCliente', 'nombre', 'estado'],
    });

    if (!cliente || cliente.estado !== 'A') {
      return null;
    }

    return cliente;
  }
}
