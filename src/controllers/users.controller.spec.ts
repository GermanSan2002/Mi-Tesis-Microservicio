import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsuarioService } from '../services/usuario.service';
import { ApiKeyGuard } from '../guard/apiKeyGuard';
import { ExecutionContext } from '@nestjs/common';
import { CreateUsuarioDTO, ModifyUsuarioDTO } from '../dto/usuarioDTO';
import { BajaAltaDTO } from '../dto/bajaDTO';
import { EstadosEntidades } from '../entities/estadosEntidades';

describe('UsersController', () => {
  let controller: UsersController;
  let usuarioService: jest.Mocked<UsuarioService>;

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
      controllers: [UsersController],
      providers: [
        {
          provide: UsuarioService,
          useValue: {
            registerUserCliente: jest.fn(),
            verifyUserCliente: jest.fn(),
            asignarRolesUsuario: jest.fn(),
            removerRolesUsuario: jest.fn(),
            getUsuariosClientes: jest.fn(),
            darBajaUsuario: jest.fn(),
            darAltaUsuario: jest.fn(),
            findUsuarioClientById: jest.fn(),
            updateUsuario: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.idCliente = 'client-uuid-123';
          return true;
        },
      })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usuarioService = module.get(UsuarioService);
    jest.clearAllMocks();
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  describe('registerUserCliente', () => {
    it('debe registrar un usuario correctamente y retornar status 201', async () => {
      const dto: CreateUsuarioDTO = {
        correo: 'test@example.com',
        contraseña: 'Password123*',
      } as CreateUsuarioDTO;

      const expectedResult = { idUsuario: 'User_01', correo: 'test@example.com' };
      usuarioService.registerUserCliente.mockResolvedValue(expectedResult as any);

      const res = mockResponse();
      await controller.registerUserCliente(mockReq, dto, res);

      expect(usuarioService.registerUserCliente).toHaveBeenCalledWith(dto, 'client-uuid-123', mockReq);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('verifyUserCliente', () => {
    it('debe verificar un usuario exitosamente y retornar status 200', async () => {
      const expectedResult = { message: 'Usuario verificado exitosamente' };
      usuarioService.verifyUserCliente.mockResolvedValue(expectedResult as any);

      const res = mockResponse();
      await controller.verifyUserCliente(mockReq, 'User_01', res);

      expect(usuarioService.verifyUserCliente).toHaveBeenCalledWith('client-uuid-123', 'User_01', mockReq);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('asignRolesUsuario', () => {
    it('debe asignar roles a un usuario correctamente', async () => {
      const rolesDto = { roles: ['rol1', 'rol2'] };
      const expectedResult = { message: 'Roles asignados exitosamente' };
      usuarioService.asignarRolesUsuario.mockResolvedValue(expectedResult as any);

      const res = mockResponse();
      await controller.asignRolesUsuario(mockReq, 'User_01', rolesDto, res);

      expect(usuarioService.asignarRolesUsuario).toHaveBeenCalledWith('User_01', 'client-uuid-123', rolesDto.roles, mockReq);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('removerRolesUsuario', () => {
    it('debe remover roles de un usuario correctamente', async () => {
      const rolesDto = { roles: ['rol1'] };
      const expectedResult = { message: 'Roles removidos exitosamente' };
      usuarioService.removerRolesUsuario.mockResolvedValue(expectedResult as any);

      const res = mockResponse();
      await controller.removerRolesUsuario(mockReq, 'User_01', rolesDto, res);

      expect(usuarioService.removerRolesUsuario).toHaveBeenCalledWith('User_01', 'client-uuid-123', rolesDto.roles, mockReq);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('getUsersClient', () => {
    it('debe obtener la lista paginada de usuarios de la empresa', async () => {
      const query = { page: 1, limit: 10, estado: EstadosEntidades.ALTA };
      const expectedResult = { data: [], meta: { totalItems: 0 } };
      usuarioService.getUsuariosClientes.mockResolvedValue(expectedResult as any);

      const res = mockResponse();
      await controller.getUsersClient(mockReq, query as any, res);

      expect(usuarioService.getUsuariosClientes).toHaveBeenCalledWith('client-uuid-123', query);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('darBajaUsuario', () => {
    it('debe dar de baja a un usuario correctamente', async () => {
      const bajaDto: BajaAltaDTO = { motivo: 'Inactividad' };
      const expectedResult = { message: 'Usuario dado de baja' };
      usuarioService.darBajaUsuario.mockResolvedValue(expectedResult as any);

      const res = mockResponse();
      await controller.darBajaUsuario(mockReq, 'User_01', bajaDto, res);

      expect(usuarioService.darBajaUsuario).toHaveBeenCalledWith('User_01', 'client-uuid-123', bajaDto.motivo, mockReq);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('darAltaUsuario', () => {
    it('debe dar de alta a un usuario correctamente', async () => {
      const altaDto: BajaAltaDTO = { motivo: 'Reactivación' };
      const expectedResult = { message: 'Usuario dado de alta' };
      usuarioService.darAltaUsuario.mockResolvedValue(expectedResult as any);

      const res = mockResponse();
      await controller.darAltaUsuario(mockReq, 'User_01', altaDto, res);

      expect(usuarioService.darAltaUsuario).toHaveBeenCalledWith('User_01', 'client-uuid-123', altaDto.motivo, mockReq as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedResult);
    });
  });

  describe('getUsuario', () => {
    it('debe retornar un usuario por su ID', async () => {
      const expectedUser = { idUsuario: 'User_01', mail: 'test@example.com' };
      usuarioService.findUsuarioClientById.mockResolvedValue(expectedUser as any);

      const res = mockResponse();
      await controller.getUsuario(mockReq, 'User_01', res);

      expect(usuarioService.findUsuarioClientById).toHaveBeenCalledWith('User_01', 'client-uuid-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedUser);
    });
  });

  describe('updateUsuario', () => {
    it('debe actualizar un usuario correctamente', async () => {
      const updateDto: ModifyUsuarioDTO = { correo: 'nuevo@example.com' } as unknown as ModifyUsuarioDTO;
      const expectedResult = { message: 'Usuario actualizado' };
      usuarioService.updateUsuario.mockResolvedValue(expectedResult as any);

      const res = mockResponse();
      await controller.updateUsuario(mockReq, 'User_01', updateDto, res);;

      expect(usuarioService.updateUsuario).toHaveBeenCalledWith(
        'User_01',
        'client-uuid-123' as any,
        updateDto,
        mockReq
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expectedResult);
    });
  });
});