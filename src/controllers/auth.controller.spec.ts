import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { ClienteService } from '../services/cliente.service';
import { UsuarioService } from '../services/usuario.service';
import { MockPropertyContext } from 'node:test';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let tokenService: jest.Mocked<TokenService>;
  let clienteService: jest.Mocked<ClienteService>;
  let usuarioService: jest.Mocked<UsuarioService>;

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockReq = {
    ip: '127.0.0.1',
    cliente: { 
      idCliente: 'client-1',
      estado: 'A',
      mailContacto: 'test@mail.com',
      apiKeyHash: 'hash',
      nombre: 'Cliente Test',
    },
    usuarioId: 'user-1'
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            hashPassword: jest.fn(),
            login: jest.fn(),
            logout: jest.fn(),
            solicitarRecuperarContraseña: jest.fn(),
            confirmarCambioContraseña: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            verifyAccessToken: jest.fn(),
            refreshAccessToken: jest.fn(),
          },
        },
        {
          provide: ClienteService,
          useValue: {
            validateApiKey: jest.fn(),
            findClienteById: jest.fn(),
          }
        },
        {
          provide: UsuarioService, // <-- Añadir este proveedor que requiere RecuperarPassGuard
          useValue: {
            findUsuarioById: jest.fn(),
            findUsuarioByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    tokenService = module.get(TokenService);
    clienteService = module.get(ClienteService);
    usuarioService = module.get(UsuarioService);

    jest.clearAllMocks();
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('debe iniciar sesión exitosamente y retornar tokens', async () => {
      const res = mockResponse();
      const credentials = { email: 'test@mail.com', password: '123' };
      const tokenResult = { accessToken: 'acc_token', refreshToken: 'ref_token' };

      authService.login.mockResolvedValue(tokenResult as any);

      await controller.login(mockReq, credentials, res);

      expect(authService.login).toHaveBeenCalledWith(credentials, mockReq.cliente, mockReq);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(tokenResult);
    });
  });

  describe('logout', () => {
    it('debe cerrar sesión correctamente', async () => {
      const res = mockResponse();
      const logoutDTO = { refreshToken: 'ref_token' };

      authService.logout.mockResolvedValue(undefined);

      await controller.logout(mockReq, logoutDTO, res);

      expect(authService.logout).toHaveBeenCalledWith('ref_token', mockReq);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Logout successful' });
    });
  });

  describe('checkAuth', () => {
    it('debe decodificar y retornar la información del token', async () => {
      const res = mockResponse();
      const decodedPayload = { userId: '12345' };

      tokenService.verifyAccessToken.mockResolvedValue(decodedPayload as any);

      await controller.checkAuth(mockReq, 'jwt_token_valido', res);

      expect(tokenService.verifyAccessToken).toHaveBeenCalledWith('jwt_token_valido');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ decoded: decodedPayload });
    });
  });

  describe('refreshAccessToken', () => {
    it('debe refrescar el access token exitosamente', async () => {
      const res = mockResponse();
      tokenService.refreshAccessToken.mockResolvedValue('new_access_token');

      await controller.refreshAccessToken(mockReq, 'refresh_token_valido', res);

      expect(tokenService.refreshAccessToken).toHaveBeenCalledWith('refresh_token_valido');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ accessToken: 'new_access_token' });
    });
  });

  describe('solicitudCambioContraseña', () => {
    it('debe solicitar la recuperación de contraseña correctamente', async () => {
      const res = mockResponse();
      const recuperarDTO = { correo: 'test@mail.com' };
      
      authService.solicitarRecuperarContraseña.mockResolvedValue('recovery_token' as any);

      const result = await controller.solicitudCambioContraseña(mockReq, recuperarDTO, res);

      expect(authService.solicitarRecuperarContraseña).toHaveBeenCalledWith(
        recuperarDTO,
        mockReq.cliente,
        mockReq,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: 'recovery_token' });
    });
  });

  describe('validarCambioPass', () => {
    it('debe validar el token de recuperación con éxito', async () => {
      const res = mockResponse();

      await controller.validarCambioContraseña(res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token válido' });
    });
  });

  describe('confirmarCambioContraseña', () => {
    it('debe cambiar la contraseña del usuario correctamente', async () => {
      const res = mockResponse();
      const cambioDTO = { contraseña: 'newPassword123' };

      authService.confirmarCambioContraseña.mockResolvedValue(undefined);

      await controller.confirmarCambioContraseña(mockReq, cambioDTO, res);

      expect(authService.confirmarCambioContraseña).toHaveBeenCalledWith(
        mockReq.usuarioId,
        cambioDTO,
        mockReq,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Contraseña cambiada exitosamente' });
    });
  });
});