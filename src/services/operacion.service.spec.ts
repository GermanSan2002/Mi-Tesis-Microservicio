import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { OperacionService } from './operacion.service';
import { Operacion } from '../entities/operacion.entity';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TipoOperacion } from '../entities/tipo-operacion.enum';
import { NotFoundException } from '@nestjs/common';

describe('OperacionService', () => {
    let service: OperacionService;
    let operacionRepository: jest.Mocked<Repository<Operacion>>;
    let usuarioRepository: jest.Mocked<Repository<Usuario>>;
    let dataSource: DataSource;
    let queryRunner: QueryRunner;
    let entityManager: jest.Mocked<Partial<EntityManager>>;

    const mockOperacionRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        findAndCount: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockUsuarioRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        findAndCount: jest.fn(),
        create: jest.fn(),
    };

    beforeEach(async () => {
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

        entityManager = {
            save: jest.fn(),
        } as unknown as jest.Mocked<Partial<EntityManager>>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OperacionService,
                {
                    provide: getRepositoryToken(Operacion),
                    useValue: mockOperacionRepository,
                },
                {
                    provide: getRepositoryToken(Usuario),
                    useValue: mockUsuarioRepository,
                },
                {
                    provide: DataSource,
                    useValue: dataSource,
                },
            ],
        }).compile();

        service = module.get<OperacionService>(OperacionService);
        operacionRepository = module.get(getRepositoryToken(Operacion));
        usuarioRepository = module.get(getRepositoryToken(Usuario))
        jest.clearAllMocks();
    })

    it('debe estar definido el servicio', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const createDto = {
            idUsuario: 'user-uuid-1',
            idCliente: 'client-uuid-1',
            tipo: TipoOperacion.CREAR_USUARIO,
            fechaRealizacion: new Date(),
            metadatos: { ip: '127.0.0.1' },
        };

        it('debe crear y guardar una operación usando el repositorio por defecto si no se pasa manager', async () => {
            const mockOperacion = {
                idOperacion: 'op-1',
                ...createDto
            } as unknown as Operacion;

            operacionRepository.create.mockReturnValue(mockOperacion);
            (operacionRepository.save as jest.Mock).mockResolvedValue(mockOperacion as never);

            const result = await service.create(createDto);

            expect(operacionRepository.create).toHaveBeenCalledWith({
                ...createDto,
                usuario: { idUsuario: createDto.idUsuario },
            });

            expect(operacionRepository.save).toHaveBeenCalledWith(mockOperacion);
            expect(result).toEqual(mockOperacion);
        });

        it('debe crear y guardar una operación usando el EntityManager si se provee', async () => {
            const mockOperacion = { idOperacion: 'op-1', ...createDto } as unknown as Operacion;

            operacionRepository.create.mockReturnValue(mockOperacion);
            (entityManager.save as jest.Mock).mockResolvedValue(mockOperacion as never);

            const result = await service.create(createDto, entityManager as EntityManager);

            expect(operacionRepository.create).toHaveBeenCalledWith({
                ...createDto,
                usuario: { idUsuario: createDto.idUsuario },
            });
            expect(entityManager.save).toHaveBeenCalledWith(Operacion, mockOperacion);
            expect(result).toEqual(mockOperacion);
        });
    });

    // =========================================================================
    // MÉTODO GETOPERACIONESBYUSUARIOID
    // =========================================================================
    describe('getOperacionesByUsuarioId', () => {
        const idUsuario = 'user-uuid-1';
        const clienteId = 'client-uuid-1';
        const baseQuery = { page: 1, limit: 10 };

        it('debe lanzar NotFoundException si el usuario no existe o no pertenece al cliente', async () => {
            usuarioRepository.findOne.mockResolvedValue(null);

            await expect(
                service.getOperacionesByUsuarioId(idUsuario, clienteId, baseQuery),
            ).rejects.toThrow(
                new NotFoundException('Usuario no encontrado o no pertenece al cliente especificado'),
            );
            expect(usuarioRepository.findOne).toHaveBeenCalledWith({
                where: { idUsuario, cliente: { idCliente: clienteId } },
            });
        });

        it('debe retornar operaciones paginadas aplicando filtros básicos', async () => {
            const mockUsuario = { idUsuario } as Usuario;
            const mockOperaciones = [{ idOperacion: 'op-1' }] as Operacion[];
            const totalItems = 1;

            usuarioRepository.findOne.mockResolvedValue(mockUsuario);
            operacionRepository.findAndCount.mockResolvedValue([mockOperaciones, totalItems]);

            const result = await service.getOperacionesByUsuarioId(idUsuario, clienteId, baseQuery);

            expect(usuarioRepository.findOne).toHaveBeenCalled();
            expect(operacionRepository.findAndCount).toHaveBeenCalledWith({
                where: {
                    usuario: { idUsuario },
                    cliente: { idCliente: clienteId },
                },
                order: { fechaRealizacion: 'DESC' },
                skip: 0,
                take: 10,
            });

            expect(result).toEqual({
                data: mockOperaciones,
                meta: {
                    totalItems,
                    itemsPerPage: 10,
                    currentPage: 1,
                    totalPages: 1,
                },
            });
        });

        it('debe aplicar filtros por tipo y rango de fechas (despueDe y antesDe)', async () => {
            const mockUsuario = { idUsuario } as Usuario;
            const fechaInicio = new Date('2026-01-01');
            const fechaFin = new Date('2026-12-31');
            const queryWithFilters = {
                page: 2,
                limit: 5,
                tipo: TipoOperacion.CREAR_USUARIO,
                despueDe: fechaInicio,
                antesDe: fechaFin,
            };

            usuarioRepository.findOne.mockResolvedValue(mockUsuario);
            operacionRepository.findAndCount.mockResolvedValue([[], 0]);

            await service.getOperacionesByUsuarioId(idUsuario, clienteId, queryWithFilters);

            expect(operacionRepository.findAndCount).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    usuario: { idUsuario },
                    cliente: { idCliente: clienteId },
                    tipo: TipoOperacion.CREAR_USUARIO,
                    fechaRealizacion: expect.any(Object),
                }),
                order: { fechaRealizacion: 'DESC' },
                skip: 5,
                take: 5,
            });
        });
    });
})