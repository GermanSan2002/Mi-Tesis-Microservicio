import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, EntityManager } from 'typeorm';
import { RolService } from './rol.service';
import { Rol } from '../entities/rol.entity';
import { CreateRolDTO } from '../dto/rolDTO';
import { EstadosEntidades } from '../entities/estadosEntidades';
import { Cliente } from 'src/entities/cliente.entity';
import { PlanesSuscripcion } from 'src/entities/planes-suscripcion.enum';

describe('RolService', () => {
    let service: RolService;
    let rolRepository: jest.Mocked<Repository<Rol>>;
    let dataSource: jest.Mocked<Partial<DataSource>>;
    let queryRunner: jest.Mocked<Partial<QueryRunner>>;

    const mockRol: Rol = {
        idRol: 'uuid-rol-1',
        idCliente: 'uuid-cliente-1',
        nombre: 'Administrador',
        descripcion: 'Rol con privilegios totales',
        estado: EstadosEntidades.ALTA,
        cliente: {} as any,
    };

    const mockCliente = {
        idCliente: "uuid-cliente-1",
    }

    beforeEach(async () => {
        // 1. Mock del QueryRunner y el manejador transaccional
        queryRunner = {
            connect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
            startTransaction: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
            commitTransaction: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
            rollbackTransaction: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
            release: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
            manager: {
                create: jest.fn(),
                save: jest.fn(),
                getRepository: jest.fn(),
            } as any,
        };

        dataSource = {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
        } as unknown as DataSource;

        const mockRolRepository = {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RolService,
                {
                    provide: getRepositoryToken(Rol),
                    useValue: mockRolRepository,
                },
                {
                    provide: DataSource,
                    useValue: dataSource,
                },
            ],
        }).compile();

        service = module.get<RolService>(RolService);
        rolRepository = module.get(getRepositoryToken(Rol));

        jest.clearAllMocks();
    });

    it('debe estar definido el servicio', () => {
        expect(service).toBeDefined();
    });

    describe('findRolesByClienteId', () => {
        it('debe retornar una lista de roles asociados a un cliente utilizando el repositorio por defecto', async () => {
            const idCliente = 'uuid-cliente-1';
            rolRepository.find.mockResolvedValue([mockRol]);

            const result = await service.findRolesByClienteId(idCliente);

            expect(rolRepository.find).toHaveBeenCalledWith({
                where: { cliente: { idCliente } },
            });
            expect(result).toEqual([mockRol]);
        });

        it('debe utilizar el EntityManager provisto si se pasa como parámetro', async () => {
            const idCliente = 'uuid-cliente-1';
            const customManager = {
                getRepository: jest.fn().mockReturnValue({
                    find: jest.fn().mockResolvedValue([mockRol] as never),
                }),
            } as unknown as EntityManager;

            const result = await service.findRolesByClienteId(idCliente, customManager);

            expect(customManager.getRepository).toHaveBeenCalledWith(Rol);
            expect(result).toEqual([mockRol]);
        });
    });

    describe('getRolesByClienteId', () => {
        it('debe retornar una lista de roles para el cliente especificado', async () => {
            const idCliente = 'uuid-cliente-1';
            rolRepository.find.mockResolvedValue([mockRol]);

            const result = await service.getRolesByClienteId(idCliente);

            expect(rolRepository.find).toHaveBeenCalledWith({
                where: { cliente: { idCliente } },
            });
            expect(result).toEqual([mockRol]);
        });
    });

    describe('createRol', () => {
        const rolData: CreateRolDTO = {
            nombre: 'ADMIN_TEST',
            descripcion: 'Rol de prueba',
        };
        const cliente = { idCliente: 'client-uuid-1' } as Cliente;

        it('debe crear y persistir un nuevo rol exitosamente bajo una transacción', async () => {
            const mockNewRol = {
                idRol: 'rol-uuid-1',
                ...rolData,
                estado: EstadosEntidades.ALTA,
                cliente,
            } as Rol;

            (queryRunner.manager!.create as jest.Mock).mockReturnValue(mockNewRol);
            (queryRunner.manager!.save as jest.Mock).mockResolvedValue(mockNewRol as never);

            (queryRunner.manager!.getRepository as jest.Mock).mockReturnValue({
                create: jest.fn().mockReturnValue(mockNewRol),
                save: jest.fn().mockResolvedValue(mockNewRol as never),
            });

            const result = await service.createRol(rolData, cliente);

            expect(queryRunner.connect).toHaveBeenCalled();
            expect(queryRunner.startTransaction).toHaveBeenCalled();
            expect(queryRunner.commitTransaction).toHaveBeenCalled();
            expect(queryRunner.release).toHaveBeenCalled();
            expect(result).toEqual(mockNewRol);
        });

        it('debe hacer rollback y lanzar el error si ocurre una falla durante la creación', async () => {
            const dbError = new Error('Error de base de datos');
            
            (queryRunner.manager!.save as jest.Mock).mockRejectedValue(dbError as never);
            (queryRunner.manager!.getRepository as jest.Mock).mockReturnValue({
                create: jest.fn().mockReturnValue({}),
                save: jest.fn().mockRejectedValue(dbError as never),
            });

            await expect(service.createRol(rolData, cliente)).rejects.toThrow('Error de base de datos');

            expect(queryRunner.startTransaction).toHaveBeenCalled();
            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(queryRunner.release).toHaveBeenCalled();
        });
    });
});