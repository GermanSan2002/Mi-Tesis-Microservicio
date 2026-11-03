import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ParametroController } from './parametro.controller';
import { ParametroService } from '../services/parametro.service';
import { CreateParametroDto, UpdateParametroDto } from '../dto/parametroDTO';
import { Response } from 'express';
import { TipoParametro } from '../entities/tipo-parametro.enum';
import { ClienteService } from '../services/cliente.service';

describe('ParametroController', () => {
  let controller: ParametroController;

  const parametroServiceMock = {
    obtenerParametrosPorCliente: jest.fn(),
    createParametro: jest.fn(),
    darAltaParametro: jest.fn(),
    darBajaParametro: jest.fn(),
    modificarParametro: jest.fn(),
  };

  const clienteServiceMock = {
    validateApiKey: jest.fn(),
  };

  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
  };

  const idCliente = 1;
  const idParametro = 'PARAM_01';

  const mockParametro = {
    idParametro,
    idCliente,
    nombre: 'limite_usuarios',
    descripcion: 'Límite de usuarios',
    tipo: TipoParametro.INTEGER,
    valorPorDefecto: 10,
    valorMinimo: 1,
    valorMaximo: 100,
    estado: 'A',
  };

  const mockRequest = {
    idCliente,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParametroController],
      providers: [
        {
          provide: ParametroService,
          useValue: parametroServiceMock,
        },
        {
            provide: ClienteService,
            useValue: clienteServiceMock,
        }
      ],
    }).compile();

    controller = module.get<ParametroController>(ParametroController);
  });

  describe('GET /parameters', () => {
    it('debe obtener los parámetros del cliente y responder con código 200', async () => {
      const parametros = [mockParametro];

      parametroServiceMock.obtenerParametrosPorCliente.mockResolvedValue(
        parametros as never,
      );

      await controller.getParametrosCliente(
        mockRequest,
        mockResponse as unknown as Response,
      );

      expect(
        parametroServiceMock.obtenerParametrosPorCliente,
      ).toHaveBeenCalledTimes(1);

      expect(
        parametroServiceMock.obtenerParametrosPorCliente,
      ).toHaveBeenCalledWith(idCliente);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(parametros);
    });

    it('debe responder con una lista vacía cuando el cliente no tiene parámetros', async () => {
      parametroServiceMock.obtenerParametrosPorCliente.mockResolvedValue([] as never);

      await controller.getParametrosCliente(
        mockRequest,
        mockResponse as unknown as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it('debe propagar el error si falla la consulta de parámetros', async () => {
      const error = new Error('Database error');

      parametroServiceMock.obtenerParametrosPorCliente.mockRejectedValue(
        error as never,
      );

      await expect(
        controller.getParametrosCliente(
          mockRequest,
          mockResponse as unknown as Response,
        ),
      ).rejects.toThrow(error);

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('POST /parameters/crear', () => {
    const dto = {
      nombre: 'limite_usuarios',
      descripcion: 'Límite de usuarios',
      tipo: TipoParametro.INTEGER,
      valorPorDefecto: 10,
      valorMinimo: 1,
      valorMaximo: 100,
    } as CreateParametroDto;

    it('debe crear un parámetro y responder con código 201', async () => {
      parametroServiceMock.createParametro.mockResolvedValue(mockParametro as never);

      await controller.crearParametro(
        mockRequest,
        dto,
        mockResponse as unknown as Response,
      );

      expect(parametroServiceMock.createParametro).toHaveBeenCalledTimes(1);

      expect(parametroServiceMock.createParametro).toHaveBeenCalledWith(
        dto,
        idCliente,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockParametro);
    });

    it('debe propagar el error si falla la creación del parámetro', async () => {
      const error = new Error('Could not register parameter');

      parametroServiceMock.createParametro.mockRejectedValue(error as never);

      await expect(
        controller.crearParametro(
          mockRequest,
          dto,
          mockResponse as unknown as Response,
        ),
      ).rejects.toThrow(error);

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /parameters/alta/:idParametro', () => {
    it('debe dar de alta un parámetro y responder con código 200', async () => {
      parametroServiceMock.darAltaParametro.mockResolvedValue(mockParametro as never);

      await controller.darAltaParametro(
        mockRequest,
        idParametro,
        mockResponse as unknown as Response,
      );

      expect(parametroServiceMock.darAltaParametro).toHaveBeenCalledTimes(1);

      expect(parametroServiceMock.darAltaParametro).toHaveBeenCalledWith(
        idParametro,
        idCliente,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockParametro);
    });

    it('debe propagar el error si falla el alta del parámetro', async () => {
      const error = new Error('Parameter not found');

      parametroServiceMock.darAltaParametro.mockRejectedValue(error as never);

      await expect(
        controller.darAltaParametro(
          mockRequest,
          idParametro,
          mockResponse as unknown as Response,
        ),
      ).rejects.toThrow(error);

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /parameters/baja/:idParametro', () => {
    it('debe dar de baja un parámetro y responder con código 200', async () => {
      const parametroInactivo = {
        ...mockParametro,
        estado: 'I',
      };

      parametroServiceMock.darBajaParametro.mockResolvedValue(
        parametroInactivo as never,
      );

      await controller.darBajaParametro(
        mockRequest,
        idParametro,
        mockResponse as unknown as Response,
      );

      expect(parametroServiceMock.darBajaParametro).toHaveBeenCalledTimes(1);

      expect(parametroServiceMock.darBajaParametro).toHaveBeenCalledWith(
        idParametro,
        idCliente,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(parametroInactivo);
    });

    it('debe propagar el error si falla la baja del parámetro', async () => {
      const error = new Error('Parameter not found');

      parametroServiceMock.darBajaParametro.mockRejectedValue(error as never);

      await expect(
        controller.darBajaParametro(
          mockRequest,
          idParametro,
          mockResponse as unknown as Response,
        ),
      ).rejects.toThrow(error);

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /parameters/update/:idParametro', () => {
    const dto = {
      descripcion: 'Nuevo límite de usuarios',
      valorPorDefecto: 20,
    } as UpdateParametroDto;

    it('debe modificar un parámetro y responder con código 200', async () => {
      const parametroActualizado = {
        ...mockParametro,
        ...dto,
      };

      parametroServiceMock.modificarParametro.mockResolvedValue(
        parametroActualizado as never,
      );

      await controller.modificarParametro(
        mockRequest,
        idParametro,
        dto,
        mockResponse as unknown as Response,
      );

      expect(parametroServiceMock.modificarParametro).toHaveBeenCalledTimes(1);

      expect(parametroServiceMock.modificarParametro).toHaveBeenCalledWith(
        dto,
        idCliente,
        idParametro,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(parametroActualizado);
    });

    it('debe propagar el error si falla la modificación del parámetro', async () => {
      const error = new Error('Could not update parameter');

      parametroServiceMock.modificarParametro.mockRejectedValue(error as never);

      await expect(
        controller.modificarParametro(
          mockRequest,
          idParametro,
          dto,
          mockResponse as unknown as Response,
        ),
      ).rejects.toThrow(error);

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});
