import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext } from '@nestjs/common';
import { ClienteController } from './cliente.controller';
import { ClienteService } from '../services/cliente.service';
import { TestingModule, Test } from '@nestjs/testing';
import { CreateClienteDto } from '../dto/clienteDTO';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { TipoUsuarioGuard } from '../guard/tipoUsuario.guard';

describe('ClienteController', () => {
    let controller: ClienteController;
    let clienteService: jest.Mocked<ClienteService>;

    const mockResponse = () => {
        const res: any = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ClienteController],
            providers: [
                {
                    provide: ClienteService,
                    useValue: {
                        registrarCliente: jest.fn(),
                        findAll: jest.fn(),
                    }
                }
            ]
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: (context: ExecutionContext) => true,
            })
            .overrideGuard(TipoUsuarioGuard)
            .useValue({
                canActivate: (context: ExecutionContext) => true,
            })
            .compile();

        controller = module.get<ClienteController>(ClienteController);
        clienteService = module.get(ClienteService);
        jest.clearAllMocks();
    });

    it('debe estar definido el controlador', () => {
        expect(controller).toBeDefined();
    });

    describe('registrarCliente', () => {
        it('debe registrar un cliente correctamente y retornar status 201', async () => {
            const dto: CreateClienteDto = {
                nombre: 'Empresa Test',
                mailContacto: 'contacto@test.com',
                plan: 'Avanzado',
            } as unknown as CreateClienteDto;

            const expectedResult = {
                cliente: { idCliente: 'uuid-123', nombre: 'Empresa Test' },
                apiKey: 'sk_test_12345',
            };

            clienteService.registrarCliente.mockResolvedValue(expectedResult as any);

            const res = mockResponse();
            await controller.registrarCliente(dto, res);

            expect(clienteService.registrarCliente).toHaveBeenCalledWith(dto);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expectedResult);
        })
    });

    describe('getClientes', () => {
        it('debe retornar la lista de clientes con status 200', async () => {
            const expectedResult = [
                { idCliente: 'uuid-1', nombre: 'Cliente 1' },
                { idCliente: 'uuid-2', nombre: 'Cliente 2' },
            ];

            clienteService.findAll.mockResolvedValue(expectedResult as any);

            const res = mockResponse();
            await controller.getClientes(res);

            expect(clienteService.findAll).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedResult);
        });
    });
});