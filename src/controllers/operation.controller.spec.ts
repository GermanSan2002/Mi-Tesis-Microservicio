import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { OperationController, PaginatedOperationQuery } from './operation.controller';
import { OperacionService } from '../services/operacion.service';
import { ApiKeyGuard } from '../guard/apiKeyGuard';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { TipoOperacion } from '../entities/tipo-operacion.enum';

describe('OperationController', () => {
    let controller: OperationController;
    let operationService: jest.Mocked<OperacionService>;

    const mockResponse = () => {
        const res: any = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    const mockReq = {
        idCliente: 'client-uuid-123',
        ip: '127.0.0.1',
        headers: { 'x-api-key': 'test-api-key' },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [OperationController],
            providers: [
                {
                    provide: OperacionService,
                    useValue: {
                        getOperacionesByUsuarioId: jest.fn(),
                    }
                }
            ]
        })
            .overrideGuard(ApiKeyGuard)
            .useValue({
                canActivate: (context: ExecutionContext) => true,
            })
            .compile();

        controller = module.get<OperationController>(OperationController);
        operationService = module.get(OperacionService);
        jest.clearAllMocks();
    })

    it('debe estar definido el controlador', () => {
        expect(controller).toBeDefined();
    });

    describe('getOperacionesByUsuarioId', () => {
        it('debe obtener las operaciones de un usuario correctamente y retornar status 200', async () => {
            const idUsuario = 'User_01';
            const query: PaginatedOperationQuery = {
                page: 1,
                limit: 10,
                tipo: TipoOperacion.INICIAR_SESION,
            };

            const expectedResult = {
                data: [
                    { idOperacion: 'op-1', tipo: TipoOperacion.INICIAR_SESION },
                ],
                meta: {
                    totalItems: 1,
                    itemsPerPage: 10,
                    currentPage: 1,
                    totalPages: 1,
                },
            };

            operationService.getOperacionesByUsuarioId.mockResolvedValue(expectedResult as any);

            const result = await controller.getOperacionesByUsuarioId(mockReq, idUsuario, query);

            expect(operationService.getOperacionesByUsuarioId).toHaveBeenCalledWith(
                idUsuario,
                'client-uuid-123',
                query,
            );
            expect(result).toEqual(expectedResult);
        })
    })
})