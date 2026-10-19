import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UsuarioService } from './usuario.service';
import { RolService } from './rol.service';
import { OperacionService } from './operacion.service';
import { ClienteService } from './cliente.service';
import { Usuario } from '../entities/usuario.entity';
import { Cliente } from '../entities/cliente.entity';
import { EstadosEntidades } from '../entities/estadosEntidades';
import { TipoOperacion } from '../entities/tipo-operacion.enum';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UsuarioService', () => {
  let service: UsuarioService;
  let usuarioRepository: jest.Mocked<Repository<Usuario>>;
  let rolService: jest.Mocked<RolService>;
  let operacionService: jest.Mocked<OperacionService>;
  let clienteService: jest.Mocked<ClienteService>;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: jest.Mocked<QueryRunner>;

  const mockReq = {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Jest-Agent' },
  };

  beforeEach(async () => {
    // 1. Mock de QueryRunner y su Manager para transacciones
    queryRunner = {
      connect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      startTransaction: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      commitTransaction: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      release: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      manager: {
        save: jest.fn(),
        getRepository: jest.fn(),
      } as any,
    } as unknown as jest.Mocked<QueryRunner>;

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as jest.Mocked<DataSource>;

    // 2. Mock del repositorio de TypeORM
    usuarioRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<Repository<Usuario>>;

    // 3. Mocks de servicios inyectados
    rolService = {
      findRolesByClienteId: jest.fn(),
    } as unknown as jest.Mocked<RolService>;

    operacionService = {
      create: jest.fn(),
    } as unknown as jest.Mocked<OperacionService>;

    clienteService = {
      findClienteById: jest.fn(),
    } as unknown as jest.Mocked<ClienteService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuarioService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: usuarioRepository,
        },
        { provide: RolService, useValue: rolService },
        { provide: OperacionService, useValue: operacionService },
        { provide: ClienteService, useValue: clienteService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<UsuarioService>(UsuarioService);
    jest.clearAllMocks();
  });

  it('debe estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  describe('Métodos de Búsqueda', () => {
    it('findUsuarioById debe retornar un usuario si existe', async () => {
      const mockUser = { idUsuario: 'user-1', correo: 'test@mail.com' } as Usuario;
      usuarioRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findUsuarioById('user-1');
      expect(result).toEqual(mockUser);
      expect(usuarioRepository.findOne).toHaveBeenCalledWith({
        where: { idUsuario: 'user-1' },
        relations: ['roles', 'cliente'],
      });
    });

    it('findUsuarioByEmail debe retornar un usuario si coincide el correo', async () => {
      const mockUser = { idUsuario: 'user-1', correo: 'test@mail.com' } as Usuario;
      usuarioRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findUsuarioByEmail('test@mail.com');
      expect(result).toEqual(mockUser);
      expect(usuarioRepository.findOne).toHaveBeenCalledWith({
        where: { correo: 'test@mail.com' },
        relations: ['roles', 'cliente'],
      });
    });
  });

  describe('registerUserCliente', () => {
    const createDto = {
      correo: 'new@mail.com',
      contraseña: 'Password123',
      parametros: {},
      roles: ['role-1'],
    };
    const clienteMock = { idCliente: 'client-1', nombre: 'Cliente Test' } as Cliente;

    it('debe lanzar NotFoundException si el cliente no existe', async () => {
      clienteService.findClienteById.mockResolvedValue(null);

      await expect(
        service.registerUserCliente(createDto, 'client-1', mockReq),
      ).rejects.toThrow(new NotFoundException('Client not found'));
    });

    it('debe lanzar ConflictException si el correo ya está registrado para el cliente', async () => {
      clienteService.findClienteById.mockResolvedValue(clienteMock);
      usuarioRepository.findOne.mockResolvedValue({ idUsuario: 'existing' } as Usuario);

      await expect(
        service.registerUserCliente(createDto, 'client-1', mockReq),
      ).rejects.toThrow(new ConflictException('Email already registered'));
    });

    it('debe registrar exitosamente un usuario cliente bajo transacción', async () => {
      clienteService.findClienteById.mockResolvedValue(clienteMock);
      usuarioRepository.findOne.mockResolvedValue(null);
      rolService.findRolesByClienteId.mockResolvedValue([
        { idRol: 'role-1', role: 'Admin' } as any,
      ]);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password' as never);

      const usuarioCreado = { idUsuario: 'user-new', ...createDto } as any;
      usuarioRepository.create.mockReturnValue(usuarioCreado);
      queryRunner.manager.save.mockResolvedValue(usuarioCreado);

      const result = await service.registerUserCliente(createDto, 'client-1', mockReq);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.save).toHaveBeenCalledWith(Usuario, usuarioCreado);
      expect(operacionService.create).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: TipoOperacion.CREAR_USUARIO }),
        queryRunner.manager,
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(result).toEqual(usuarioCreado);
    });
  });

  describe('verifyUserCliente', () => {
    it('debe lanzar NotFoundException si el usuario no existe al verificar', async () => {
      jest.spyOn(service, 'findUsuarioById').mockResolvedValue(null);

      await expect(
        service.verifyUserCliente('client-1', 'user-1', mockReq),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });

    it('debe lanzar ConflictException si el usuario ya se encuentra verificado', async () => {
      const mockUser = {
        idUsuario: 'user-1',
        verificado: true,
        cliente: { idCliente: 'client-1' },
      } as any;
      jest.spyOn(service, 'findUsuarioById').mockResolvedValue(mockUser);

      await expect(
        service.verifyUserCliente('client-1', 'user-1', mockReq),
      ).rejects.toThrow(new ConflictException('User is already verified'));
    });
  });

  describe('verifySolicitudCambio', () => {
    it('debe lanzar NotFoundException si no encuentra el usuario', async () => {
      jest.spyOn(service, 'findUsuarioById').mockResolvedValue(null);

      await expect(
        service.verifySolicitudCambio('user-1', 'token-123'),
      ).rejects.toThrow(new NotFoundException('No se encontro el usaurio de la solicitud'));
    });

    it('debe lanzar UnauthorizedException si el token de recuperación no coincide', async () => {
      const mockUser = {
        idUsuario: 'user-1',
        recuperacionTokenHash: 'hash_correcto',
      } as any;
      jest.spyOn(service, 'findUsuarioById').mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash_diferente' as never);

      await expect(
        service.verifySolicitudCambio('user-1', 'token-incorrecto'),
      ).rejects.toThrow(new UnauthorizedException('El token proporcionado no es valido'));
    });
  });
});