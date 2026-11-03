
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';

import { ParametroService } from './parametro.service';
import { Parametro } from '../entities/parametro.entity';
import { EstadosEntidades } from '../entities/estadosEntidades';
import { TipoParametro } from '../entities/tipo-parametro.enum';
import { CreateParametroDto, UpdateParametroDto } from '../dto/parametroDTO';

describe('ParametroService', () => {
  let service: ParametroService;
  let parametroRepository: jest.Mocked<Repository<Parametro>>;
  let dataSource: jest.Mocked<DataSource>;

  let queryRunner: any;
  let transactionRepository: any;

  const idCliente = 'cliente-123';
  const idParametro = 'parametro-123';

  const crearParametro = (overrides: Partial<Parametro> = {}): Parametro =>
    ({
      idParametro,
      idCliente,
      nombre: 'limite_diario',
      descripcion: 'Límite diario de operaciones',
      tipo: TipoParametro.NUMBER,
      valorPorDefecto: 100,
      valorMinimo: 0,
      valorMaximo: 500,
      estado: EstadosEntidades.ALTA,
      ...overrides,
    }) as Parametro;

  const crearDTO = (
    overrides: Partial<CreateParametroDto> = {},
  ): CreateParametroDto =>
    ({
      nombre: 'limite_diario',
      descripcion: 'Límite diario de operaciones',
      tipo: TipoParametro.NUMBER,
      valorPorDefecto: 100,
      valorMinimo: 0,
      valorMaximo: 500,
      ...overrides,
    }) as CreateParametroDto;

  beforeEach(async () => {
    transactionRepository = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation(async (data) => data),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined as never),
      startTransaction: jest.fn().mockResolvedValue(undefined as never),
      commitTransaction: jest.fn().mockResolvedValue(undefined as never),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined as never),
      release: jest.fn().mockResolvedValue(undefined as never),
      manager: {
        getRepository: jest.fn().mockReturnValue(transactionRepository),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParametroService,
        {
          provide: getRepositoryToken(Parametro),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<ParametroService>(ParametroService);
    parametroRepository = module.get(getRepositoryToken(Parametro));
    dataSource = module.get(DataSource);
  });

  // --------------------------------------------------
  // findByIdAndClient
  // --------------------------------------------------

  describe('findByIdAndClient', () => {
    it('debe encontrar un parámetro por ID y cliente', async () => {
      const parametro = crearParametro();

      parametroRepository.findOne.mockResolvedValue(parametro);

      const resultado = await service.findByIdAndClient(
        idParametro,
        idCliente,
      );

      expect(resultado).toEqual(parametro);
      expect(parametroRepository.findOne).toHaveBeenCalledWith({
        where: { idParametro, idCliente },
      });
    });

    it('debe lanzar NotFoundException si el parámetro no existe', async () => {
      parametroRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findByIdAndClient(idParametro, idCliente),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // --------------------------------------------------
  // findByNameAndCliente
  // --------------------------------------------------

  describe('findByNameAndCliente', () => {
    it('debe encontrar un parámetro por nombre y cliente', async () => {
      const parametro = crearParametro();

      parametroRepository.findOne.mockResolvedValue(parametro);

      const resultado = await service.findByNameAndCliente(
        'limite_diario',
        idCliente,
      );

      expect(resultado).toEqual(parametro);
      expect(parametroRepository.findOne).toHaveBeenCalledWith({
        where: { nombre: 'limite_diario', idCliente },
      });
    });

    it('debe retornar null si el parámetro no existe', async () => {
      parametroRepository.findOne.mockResolvedValue(null);

      const resultado = await service.findByNameAndCliente(
        'inexistente',
        idCliente,
      );

      expect(resultado).toBeNull();
    });
  });

  // --------------------------------------------------
  // createParametro
  // --------------------------------------------------

  describe('createParametro', () => {
    it('debe crear y persistir un parámetro exitosamente', async () => {
      const dto = crearDTO();

      parametroRepository.findOne.mockResolvedValue(null);

      const resultado = await service.createParametro(dto, idCliente);

      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();

      expect(transactionRepository.create).toHaveBeenCalledWith({
        ...dto,
        estado: EstadosEntidades.ALTA,
        idCliente,
      });

      expect(transactionRepository.save).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();

      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();

      expect(resultado).toMatchObject({
        nombre: dto.nombre,
        idCliente,
        estado: EstadosEntidades.ALTA,
      });
    });

    it('debe rechazar la creación de un parámetro duplicado', async () => {
      parametroRepository.findOne.mockResolvedValue(crearParametro());

      await expect(
        service.createParametro(crearDTO(), idCliente),
      ).rejects.toThrow(ConflictException);

      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('debe permitir crear un parámetro sin valor por defecto', async () => {
      parametroRepository.findOne.mockResolvedValue(null);

      const dto = crearDTO({ valorPorDefecto: null });

      const resultado = await service.createParametro(dto, idCliente);

      expect(resultado).toBeDefined();
      expect(transactionRepository.save).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it.each([
      [TipoParametro.NUMBER, 'texto'],
      [TipoParametro.INTEGER, 10.5],
      [TipoParametro.STRING, 100],
      [TipoParametro.BOOLEAN, 'true'],
      [TipoParametro.DATE, 'fecha-invalida'],
    ])(
      'debe rechazar un valor por defecto inválido para el tipo %s',
      async (tipo, valor) => {
        parametroRepository.findOne.mockResolvedValue(null);

        const dto = crearDTO({
          tipo,
          valorPorDefecto: valor,
        } as Partial<CreateParametroDto>);

        await expect(
          service.createParametro(dto, idCliente),
        ).rejects.toThrow(BadRequestException);

        expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
      },
    );

    it('debe rechazar un valor inferior al mínimo permitido', async () => {
      parametroRepository.findOne.mockResolvedValue(null);

      const dto = crearDTO({
        valorPorDefecto: -10,
        valorMinimo: 0,
      });

      await expect(
        service.createParametro(dto, idCliente),
      ).rejects.toThrow(BadRequestException);

      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('debe rechazar un valor superior al máximo permitido', async () => {
      parametroRepository.findOne.mockResolvedValue(null);

      const dto = crearDTO({
        valorPorDefecto: 600,
        valorMaximo: 500,
      });

      await expect(
        service.createParametro(dto, idCliente),
      ).rejects.toThrow(BadRequestException);

      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('debe hacer rollback y lanzar InternalServerErrorException si falla la persistencia', async () => {
      parametroRepository.findOne.mockResolvedValue(null);

      transactionRepository.save.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.createParametro(crearDTO(), idCliente),
      ).rejects.toThrow(InternalServerErrorException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------
  // obtenerParametrosPorCliente
  // --------------------------------------------------

  describe('obtenerParametrosPorCliente', () => {
    it('debe obtener los parámetros activos de un cliente', async () => {
      const parametros = [crearParametro()];

      parametroRepository.find.mockResolvedValue(parametros);

      const resultado = await service.obtenerParametrosPorCliente(idCliente);

      expect(parametroRepository.find).toHaveBeenCalledWith({
        where: {
          idCliente,
          estado: EstadosEntidades.ALTA,
        },
      });

      expect(resultado).toEqual(parametros);
    });

    it('debe utilizar el repositorio proporcionado por EntityManager', async () => {
      const parametros = [crearParametro()];
      const manager = {
        getRepository: jest.fn().mockReturnValue(transactionRepository),
      } as unknown as EntityManager;

      transactionRepository.find.mockResolvedValue(parametros);

      const resultado = await service.obtenerParametrosPorCliente(
        idCliente,
        manager,
      );

      expect(manager.getRepository).toHaveBeenCalledWith(Parametro);
      expect(transactionRepository.find).toHaveBeenCalledWith({
        where: {
          idCliente,
          estado: EstadosEntidades.ALTA,
        },
      });

      expect(resultado).toEqual(parametros);
      expect(parametroRepository.find).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------
  // modificarParametro
  // --------------------------------------------------

  describe('modificarParametro', () => {
    it('debe modificar un parámetro exitosamente', async () => {
      const parametro = crearParametro();

      parametroRepository.findOne.mockResolvedValue(parametro);

      const dto = {
        descripcion: 'Nueva descripción',
        valorPorDefecto: 200,
      } as UpdateParametroDto;

      const resultado = await service.modificarParametro(
        dto,
        idCliente,
        idParametro,
      );

      expect(parametro).toMatchObject(dto as any);
      expect(transactionRepository.save).toHaveBeenCalledWith(parametro);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();

      expect(resultado).toEqual(parametro);
    });

    it('debe rechazar la modificación si el parámetro no existe', async () => {
      parametroRepository.findOne.mockResolvedValue(null);

      await expect(
        service.modificarParametro(
          { descripcion: 'Nueva descripción' } as UpdateParametroDto,
          idCliente,
          idParametro,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('debe validar el nuevo tipo y el valor por defecto', async () => {
      const parametro = crearParametro();

      parametroRepository.findOne.mockResolvedValue(parametro);

      const dto = {
        valorPorDefecto: 'texto',
        tipo: TipoParametro.NUMBER,
      } as unknown as UpdateParametroDto;

      await expect(
        service.modificarParametro(dto, idCliente, idParametro),
      ).rejects.toThrow(BadRequestException);

      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('debe validar los nuevos límites utilizando el valor por defecto existente', async () => {
      const parametro = crearParametro({
        valorPorDefecto: 100,
        valorMaximo: 500,
      });

      parametroRepository.findOne.mockResolvedValue(parametro);

      const dto = {
        valorMaximo: 50,
      } as UpdateParametroDto;

      await expect(
        service.modificarParametro(dto, idCliente, idParametro),
      ).rejects.toThrow(BadRequestException);

      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('debe hacer rollback si falla la persistencia', async () => {
      parametroRepository.findOne.mockResolvedValue(crearParametro());

      transactionRepository.save.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.modificarParametro(
          { descripcion: 'Nueva descripción' } as UpdateParametroDto,
          idCliente,
          idParametro,
        ),
      ).rejects.toThrow(InternalServerErrorException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------
  // verifyParametros
  // --------------------------------------------------

  describe('verifyParametros', () => {
    it('debe retornar true si no se reciben parámetros', async () => {
      await expect(
        service.verifyParametros({}, idCliente),
      ).resolves.toBe(true);

      await expect(
        service.verifyParametros(null, idCliente),
      ).resolves.toBe(true);

      expect(parametroRepository.find).not.toHaveBeenCalled();
    });

    it('debe retornar true cuando todos los parámetros son válidos', async () => {
      const parametro = crearParametro();

      parametroRepository.find.mockResolvedValue([parametro]);

      const resultado = await service.verifyParametros(
        { limite_diario: 200 },
        idCliente,
      );

      expect(resultado).toBe(true);
    });

    it('debe rechazar parámetros que no están definidos para el cliente', async () => {
      parametroRepository.find.mockResolvedValue([]);

      await expect(
        service.verifyParametros(
          { parametro_inexistente: 100 },
          idCliente,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar parámetros que no se encuentran activos', async () => {
      parametroRepository.find.mockResolvedValue([]);

      await expect(
        service.verifyParametros(
          { limite_diario: 100 },
          idCliente,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it.each([
      [TipoParametro.NUMBER, 'texto'],
      [TipoParametro.INTEGER, 10.5],
      [TipoParametro.STRING, 100],
      [TipoParametro.BOOLEAN, 'true'],
      [TipoParametro.DATE, 'fecha-invalida'],
    ])(
      'debe rechazar valores incompatibles con el tipo %s',
      async (tipo, valor) => {
        const parametro = crearParametro({ tipo });

        parametroRepository.find.mockResolvedValue([parametro]);

        await expect(
          service.verifyParametros(
            { limite_diario: valor },
            idCliente,
          ),
        ).rejects.toThrow(BadRequestException);
      },
    );

    it('debe rechazar valores inferiores al mínimo', async () => {
      parametroRepository.find.mockResolvedValue([
        crearParametro({
          valorMinimo: 10,
          valorMaximo: 500,
        }),
      ]);

      await expect(
        service.verifyParametros(
          { limite_diario: 5 },
          idCliente,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar valores superiores al máximo', async () => {
      parametroRepository.find.mockResolvedValue([
        crearParametro({
          valorMinimo: 0,
          valorMaximo: 500,
        }),
      ]);

      await expect(
        service.verifyParametros(
          { limite_diario: 600 },
          idCliente,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe aceptar valores iguales a los límites', async () => {
      parametroRepository.find.mockResolvedValue([
        crearParametro({
          valorMinimo: 10,
          valorMaximo: 500,
        }),
      ]);

      await expect(
        service.verifyParametros(
          { limite_diario: 10 },
          idCliente,
        ),
      ).resolves.toBe(true);

      await expect(
        service.verifyParametros(
          { limite_diario: 500 },
          idCliente,
        ),
      ).resolves.toBe(true);
    });
  });

  // --------------------------------------------------
  // darBajaParametro
  // --------------------------------------------------

  describe('darBajaParametro', () => {
    it('debe dar de baja un parámetro exitosamente', async () => {
      const parametro = crearParametro();

      parametroRepository.findOne.mockResolvedValue(parametro);

      const resultado = await service.darBajaParametro(
        idParametro,
        idCliente,
      );

      expect(resultado.estado).toBe(EstadosEntidades.BAJA);
      expect(transactionRepository.save).toHaveBeenCalledWith(parametro);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('debe rechazar la baja de un parámetro que ya está inactivo', async () => {
      parametroRepository.findOne.mockResolvedValue(
        crearParametro({ estado: EstadosEntidades.BAJA }),
      );

      await expect(
        service.darBajaParametro(idParametro, idCliente),
      ).rejects.toThrow(BadRequestException);

      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el parámetro no existe', async () => {
      parametroRepository.findOne.mockResolvedValue(null);

      await expect(
        service.darBajaParametro(idParametro, idCliente),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe hacer rollback si falla la persistencia', async () => {
      parametroRepository.findOne.mockResolvedValue(crearParametro());

      transactionRepository.save.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.darBajaParametro(idParametro, idCliente),
      ).rejects.toThrow(InternalServerErrorException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------
  // darAltaParametro
  // --------------------------------------------------

  describe('darAltaParametro', () => {
    it('debe dar de alta un parámetro exitosamente', async () => {
      const parametro = crearParametro({
        estado: EstadosEntidades.BAJA,
      });

      parametroRepository.findOne.mockResolvedValue(parametro);

      const resultado = await service.darAltaParametro(
        idParametro,
        idCliente,
      );

      expect(resultado.estado).toBe(EstadosEntidades.ALTA);
      expect(transactionRepository.save).toHaveBeenCalledWith(parametro);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('debe rechazar el alta de un parámetro que ya está activo', async () => {
      parametroRepository.findOne.mockResolvedValue(crearParametro());

      await expect(
        service.darAltaParametro(idParametro, idCliente),
      ).rejects.toThrow(BadRequestException);

      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el parámetro no existe', async () => {
      parametroRepository.findOne.mockResolvedValue(null);

      await expect(
        service.darAltaParametro(idParametro, idCliente),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe hacer rollback si falla la persistencia', async () => {
      parametroRepository.findOne.mockResolvedValue(
        crearParametro({ estado: EstadosEntidades.BAJA }),
      );

      transactionRepository.save.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.darAltaParametro(idParametro, idCliente),
      ).rejects.toThrow(InternalServerErrorException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
