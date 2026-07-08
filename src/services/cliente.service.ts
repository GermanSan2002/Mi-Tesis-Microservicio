import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Cliente } from "src/entities/cliente.entity";
import { DataSource, EntityManager, Repository } from "typeorm";
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { CreateClienteDto } from "src/dto/clienteDTO";

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

    async findClienteById(idCliente: string, manager?: EntityManager): Promise<Cliente|null> {
        const repo = this.getRepository(manager);
        return repo.findOne({ where: { idCliente: idCliente } });
    }

    async registrarCliente(dto: CreateClienteDto): Promise<{ cliente: Cliente; apiKey: string }> {
        // 1. Generar la API Key segura y aleatoria
        const apiKeyOriginal = `sk_${crypto.randomBytes(32).toString('hex')}`;

        // 2. Hashear la API Key antes de guardarla
        const saltRounds = parseInt(process.env.HASH_SALT_ROUNDS || '10', 10);
        const apiKeyHash = await bcrypt.hash(apiKeyOriginal, saltRounds);

        //
        const nuevoCliente = this.clienteRepository.create({
            nombre: dto.nombre,
            mailContacto: dto.mailContacto,
            plan: dto.plan,
            estado: 'A', // 'A' de Activo por defecto al registrar
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
        } catch (error){
            await queryRunner.rollbackTransaction();

            throw new InternalServerErrorException('Could not register client');
        } finally {
            await queryRunner.release();
        }
    }

    // 🎯 CORRECCIÓN: Cambiado clientId a string para coincidir con tu UUID
    async validateApiKey(clientId: string, apiKeyProvista: string): Promise<boolean> {
        const cliente = await this.clienteRepository
            .createQueryBuilder('cliente')
            .where('cliente.id_cliente = :clientId', { clientId })
            .addSelect('cliente.apiKeyHash') 
            .getOne();

        if (!cliente || !cliente.apiKeyHash) {
            return false;
        }

        return await bcrypt.compare(apiKeyProvista, cliente.apiKeyHash);
    }

    async registrarCliente2(){

    }
}