import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ClienteService } from './cliente.service';
import { Cliente } from '../entities/cliente.entity';
import { EstadosEntidades } from '../entities/estadosEntidades';
import { PlanesSuscripcion } from '../entities/planes-suscripcion.enum';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('ClienteService', () => {
    let service: ClienteService;
    let clienteRepository: jest.Mocked<Repository<Cliente>>;
    let dataSource: DataSource;
    let queryRunner: QueryRunner;

    const mockClienteRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    };

    beforeEach(async () => {
        // 1. Simulación del QueryRunner y Transaction Manager de TypeORM
        queryRunner = {
            connect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
            startTransaction: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
            commitTransaction: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
            rollbackTransaction: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
            release: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
            manager: {
                save: jest.fn()
            } as any,
        } as unknown as QueryRunner;

        dataSource = {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
        } as unknown as DataSource;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClienteService,
                {
                    provide: getRepositoryToken(Cliente),
                    useValue: mockClienteRepository,
                },
                {
                    provide: DataSource,
                    useValue: dataSource,
                },
                {
                    provide: CACHE_MANAGER,
                    useValue: {
                        get: jest.fn(),
                        set: jest.fn(),
                        del: jest.fn(),
                        reset: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<ClienteService>(ClienteService);
        clienteRepository = module.get(getRepositoryToken(Cliente));
        jest.clearAllMocks();
    });

    it('debe estar definido el servicio', () => {
        expect(service).toBeDefined();
    });

    // =========================================================================
    // MÉTODO FINDALL
    // =========================================================================
    describe('findAll', () => {
        it('debe retornar una lista de clientes', async () => {
            const mockClientes = [{ idCliente: '1', nombre: 'Cliente 1' }] as Cliente[];
            clienteRepository.find.mockResolvedValue(mockClientes);

            const result = await service.findAll();
            expect(result).toEqual(mockClientes);
            expect(clienteRepository.find).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // MÉTODO REGISTRARCLIENTE
    // =========================================================================
    describe('registrarCliente', () => {
        const createDto = {
            nombre: 'Empresa S.A.',
            mailContacto: 'contacto@empresa.com',
            plan: PlanesSuscripcion.ORO,
        };

        it('debe registrar un cliente exitosamente y retornar la apiKey original', async () => {
            const mockNuevoCliente = {
                nombre: createDto.nombre,
                mailContacto: createDto.mailContacto,
                plan: createDto.plan,
                estado: EstadosEntidades.ALTA
            } as Cliente;

            const mockSavedCliente = {
                ...mockNuevoCliente,
                idCliente: 'uuid-1',
            } as Cliente;

            clienteRepository.create.mockReturnValue(mockNuevoCliente);
            (queryRunner.manager!.save as jest.Mock).mockResolvedValue(mockSavedCliente as never);

            clienteRepository.create.mockReturnValue(mockNuevoCliente);
            (queryRunner.manager.save as jest.Mock).mockResolvedValue(mockSavedCliente as never);

            const result = await service.registrarCliente(createDto);

            expect(queryRunner.connect).toHaveBeenCalled();
            expect(queryRunner.startTransaction).toHaveBeenCalled();
            expect(clienteRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    nombre: createDto.nombre,
                    mailContacto: createDto.mailContacto,
                    plan: createDto.plan,
                    estado: EstadosEntidades.ALTA,
                    apiKeyHash: expect.any(String),
                }),
            );
            expect(queryRunner.manager.save).toHaveBeenCalledWith(Cliente, mockNuevoCliente);
            expect(queryRunner.commitTransaction).toHaveBeenCalled();
            expect(queryRunner.release).toHaveBeenCalled();

            expect(result).toHaveProperty('cliente', mockSavedCliente);
            expect(result).toHaveProperty('apiKey');
            expect(result.apiKey.startsWith('sk_')).toBe(true);
        });

        it('debe hacer rollback y lanzar InternalServerErrorException si ocurre un error', async () => {
            clienteRepository.create.mockReturnValue({} as Cliente);
            (queryRunner.manager.save as jest.Mock).mockRejectedValue(new Error('DB Error') as never);

            await expect(service.registrarCliente(createDto)).rejects.toThrow(
                InternalServerErrorException,
            );
            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(queryRunner.release).toHaveBeenCalled();
        });
    });
    // =========================================================================
    // MÉTODO VALIDATEAPIKEY
    // =========================================================================
    describe('validateApiKey', () => {
        it('debe retornar el cliente si la API Key es válida y está activa', async () => {
            const rawApiKey = 'sk_test_key';
            const hashedKey = crypto.createHash('sha256').update(rawApiKey).digest('hex');
            const mockCliente = {
                idCliente: 'uuid-1',
                nombre: 'Empresa',
                estado: 'A',
            } as Cliente;

            clienteRepository.findOne.mockResolvedValue(mockCliente);

            const result = await service.validateApiKey(rawApiKey);

            expect(result).toEqual(mockCliente);
            expect(clienteRepository.findOne).toHaveBeenCalledWith({
                where: { apiKeyHash: hashedKey },
                select: ['idCliente', 'nombre', 'estado'],
            });
        });

        it('debe retornar null si la API Key no coincide con ningún registro', async () => {
            clienteRepository.findOne.mockResolvedValue(null);

            const result = await service.validateApiKey('sk_invalid');
            expect(result).toBeNull();
        });

        it('debe retornar null si el cliente encontrado no está activo (estado !== "A")', async () => {
            const mockCliente = {
                idCliente: 'uuid-1',
                nombre: 'Empresa',
                estado: 'B', // Inactivo/Baja
            } as Cliente;

            clienteRepository.findOne.mockResolvedValue(mockCliente);

            const result = await service.validateApiKey('sk_inactive');
            expect(result).toBeNull();
        });
    });
});