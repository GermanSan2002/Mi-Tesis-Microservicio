import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { RolController } from './roles.controller';
import { RolService } from '../services/rol.service';
import { ApiKeyGuard } from '../guard/apiKeyGuard';
import { ExecutionContext } from '@nestjs/common';
import { CreateRolDTO } from '../dto/rolDTO';
import { EstadosEntidades } from '../entities/estadosEntidades';
import { Cliente } from '../entities/cliente.entity';

describe('RolController', () => {
    let controller: RolController;
    let rolService: jest.Mocked<RolService>;

    const mockResponse = () => {
        const res: any = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    const mockReq = {
        idCliente: 'client-uuid-123',
        cliente: {idCliente: 'client-uuid-123'} as Cliente,
        ip: '127.0.0.1',
        headers: { 'x-api-key': 'test-api-key' },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RolController],
            providers: [
                {
                    provide: RolService,
                    useValue: {
                        getRolesByClienteId: jest.fn(),
                        createRol: jest.fn(),
                    }
                }
            ]
        })
            .overrideGuard(ApiKeyGuard)
            .useValue({
                canActivate: (context: ExecutionContext) => true,
            })
            .compile();

        controller = module.get<RolController>(RolController);
        rolService = module.get(RolService);
        jest.clearAllMocks();
    });

    it('debe estar definido el controlador', () => {
        expect(controller).toBeDefined();
    });

    describe('getRoles', () => {
        it('debe obtener la lista de roles del cliente y retornar status 200', async () => {
            const expectedRoles = [
                { idRol: 'rol-1', nombre: 'ADMIN', descripcion: 'Administrador' },
                { idRol: 'rol-2', nombre: 'USER', descripcion: 'Usuario regular' },
            ];

            rolService.getRolesByClienteId.mockResolvedValue(expectedRoles as any);

            const res = mockResponse();
            await controller.getRoles(mockReq, res);

            expect(rolService.getRolesByClienteId).toHaveBeenCalledWith('client-uuid-123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedRoles);
        })
    });

    describe('registerRol', () => {
        it('debe registrar un nuevo rol exitosamente y retornar status 201', async () => {
            const rolDTO: CreateRolDTO = {
                nombre: 'SUPERVISOR',
                descripcion: 'Rol de supervisor de operaciones',
            } as CreateRolDTO;

            const expectedRol = {
                idRol: 'rol-new-123',
                nombre: 'SUPERVISOR',
                descripcion: 'Rol de supervisor de operaciones',
                estado: EstadosEntidades.ALTA,
            };

            rolService.createRol.mockResolvedValue(expectedRol as any);

            const res = mockResponse();
            await controller.registerRol(mockReq, rolDTO, res);

            expect(rolService.createRol).toHaveBeenCalledWith(rolDTO, mockReq.cliente);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expectedRol);
        });
    });
})