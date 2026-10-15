import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsuarioService } from './usuario.service';
import { SesionService } from './sesion.service';
import { OperacionService } from './operacion.service';
import { TokenService } from './token.service';
import { EstadosEntidades } from '../entities/estadosEntidades';
import { TipoOperacion } from '../entities/tipo-operacion.enum';
import { EstadosSesion } from '../entities/estadosSesiones.enum';
import { Cliente } from '../entities/cliente.entity';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usuarioService: jest.Mocked<UsuarioService>;
  let sesionService: jest.Mocked<SesionService>;
  let operacionService: jest.Mocked<OperacionService>;
  let tokenService: jest.Mocked<TokenService>;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  const mockReq = {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'Jest-Agent' },
  };

  beforeEach(async () => {
    // 1. Simulación del QueryRunner y Transaction Manager de TypeORM
    queryRunner = {
      connect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      startTransaction: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      commitTransaction: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      release: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      manager: {} as any,
    } as unknown as QueryRunner;

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as DataSource;

    // 2. Mocks de servicios inyectados con tipado estricto de Jest
    usuarioService = {
      findUsuarioByEmail: jest.fn(),
      registrarLoginFallido: jest.fn(),
      findUsuarioByEmailAndCliente: jest.fn(),
      solicitudCambioContraseña: jest.fn(),
      findUsuarioById: jest.fn(),
      saveUsuario: jest.fn(),
    } as unknown as jest.Mocked<UsuarioService>;

    sesionService = {
      create: jest.fn(),
      updateRefreshTokenHash: jest.fn(),
      findById: jest.fn(),
      updateSesion: jest.fn(),
    } as unknown as jest.Mocked<SesionService>;

    operacionService = {
      create: jest.fn(),
    } as unknown as jest.Mocked<OperacionService>;

    tokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
      generateRecuperarToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsuarioService, useValue: usuarioService },
        { provide: SesionService, useValue: sesionService },
        { provide: OperacionService, useValue: operacionService },
        { provide: TokenService, useValue: tokenService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('debe estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword & comparePassword', () => {
    it('debe retornar el hash generado por bcrypt', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pwd' as never);
      const res = await service.hashPassword('plain_pwd');
      expect(res).toBe('hashed_pwd');
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    it('debe validar la contraseña mediante bcrypt.compare', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true as never);
      const res = await service.comparePassword('plain_pwd', 'hashed_pwd');
      expect(res).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('plain_pwd', 'hashed_pwd');
    });
  });

  /** 
    Metodo Login
  */
  describe('login', () => {
    const credentials = { email: 'test@example.com', password: 'password123' };

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      usuarioService.findUsuarioByEmail.mockResolvedValue(null);

      await expect(service.login(credentials, mockReq)).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
    })

    it('debe verificar que el usuario este verificado y registrar la operacion fallida si no es asi', async () => {
      const mockUser = {
        idUsuario: 'user-1',
        contraseña: 'hashed_pwd',
        estado: EstadosEntidades.ALTA,
        verificado: false
      } as any;

      usuarioService.findUsuarioByEmail.mockResolvedValue(mockUser);
      usuarioService.registrarLoginFallido.mockResolvedValue(mockUser);

      await expect(service.login(credentials, mockReq)).rejects.toThrow(
        new UnauthorizedException('User not verified or down'),
      );
      expect(usuarioService.registrarLoginFallido).toHaveBeenCalledWith(
        mockUser,
        mockReq,
      );
    })

    it('debe registrar login fallido y lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      const mockUser = {
        idUsuario: 'user-1',
        contraseña: 'hashed_pwd',
        estado: EstadosEntidades.ALTA,
        verificado: true
      } as any;

      usuarioService.findUsuarioByEmail.mockResolvedValue(mockUser);
      jest.spyOn(service, 'comparePassword').mockResolvedValue(false);
      usuarioService.registrarLoginFallido.mockResolvedValue(mockUser);

      await expect(service.login(credentials, mockReq)).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
      expect(usuarioService.registrarLoginFallido).toHaveBeenCalledWith(
        mockUser,
        mockReq,
      );
    })

    it('debe lanzar error de usuario bloqueado si tras el fallo su estado pasa a BAJA', async () => {
      const mockUser = {
        idUsuario: 'user-1',
        contraseña: 'hashed_pwd',
        estado: EstadosEntidades.ALTA,
        verificado: true
      } as any;

      const mockUserBloqueado = {
        ...mockUser,
        estado: EstadosEntidades.BAJA,
      } as any;

      usuarioService.findUsuarioByEmail.mockResolvedValue(mockUser);
      jest.spyOn(service, 'comparePassword').mockResolvedValue(false);
      usuarioService.registrarLoginFallido.mockResolvedValue(mockUserBloqueado);

      await expect(service.login(credentials, mockReq)).rejects.toThrow(
        new UnauthorizedException(
          'Invalid email or password. User blocked, recover password',
        ),
      );
    })

    it('debe completar el inicio de sesión exitoso bajo una transacción', async () => {
      const mockUser = {
        idUsuario: 'user-1',
        idCliente: 'client-1',
        contraseña: 'hashed_pwd',
        verificado: true,
      } as any;
      const mockSesion = { idSesion: 'sesion-123' } as any;

      usuarioService.findUsuarioByEmail.mockResolvedValue(mockUser);
      jest.spyOn(service, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(service, 'hashPassword').mockResolvedValue('hashed_refresh_token');

      sesionService.create.mockResolvedValue(mockSesion);
      tokenService.generateAccessToken.mockReturnValue('access_token_123');
      tokenService.generateRefreshToken.mockReturnValue('refresh_token_123');

      const result = await service.login(credentials, mockReq);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(sesionService.create).toHaveBeenCalledWith(
        expect.objectContaining({ idUsuario: mockUser.idUsuario }),
        queryRunner.manager,
      );
      expect(operacionService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: TipoOperacion.INICIAR_SESION,
          idCliente: mockUser.idCliente,
        }),
        queryRunner.manager,
      );
      expect(sesionService.updateRefreshTokenHash).toHaveBeenCalledWith(
        'sesion-123',
        'hashed_refresh_token',
        queryRunner.manager,
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'access_token_123',
        refreshToken: 'refresh_token_123',
      });
    });

    it('debe hacer rollback y liberar el QueryRunner ante cualquier error transaccional', async () => {
      const mockUser = {
        idUsuario: 'user-1',
        contraseña: 'hashed_pwd',
        verificado: true,
      } as any;

      usuarioService.findUsuarioByEmail.mockResolvedValue(mockUser);
      jest.spyOn(service, 'comparePassword').mockResolvedValue(true);
      sesionService.create.mockRejectedValue(new Error('DB Timeout'));

      await expect(service.login(credentials, mockReq)).rejects.toThrow('DB Timeout');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  })

  /**
    Metodo Logout
  */
  describe('logout', () => {
    const refreshToken = 'token.valido';

    it('debe lanzar UnauthorizedException si la sesión no existe', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({
        sesionId: "sesion1",
        userId: "user1",
        clientId: "client1"
      });

      sesionService.findById.mockResolvedValue(null);

      await expect(service.logout(refreshToken, mockReq)).rejects.toThrow(
        new UnauthorizedException('Session not found'),
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    })
    it('debe lanzar UnauthorizedException si la sesión ya está inactiva', async () => {
      const mockSesion = {
        idSesion: "sesion1",
        idUsuario: "user1",
        estado: EstadosSesion.INVALIDA
      } as any;

      sesionService.findById.mockResolvedValue(null);
      tokenService.verifyRefreshToken.mockResolvedValue({
        sesionId: "sesion1",
        userId: "user1",
        clientId: "client1"
      });
      sesionService.findById.mockResolvedValue(mockSesion);
      await expect(service.logout(refreshToken, mockReq)).rejects.toThrow(
        new UnauthorizedException('Session is already inactive'),
      );
    })
    it('debe invalidar sesión y persistir auditoría con éxito', async () => {
      const payload = { sesionId: 'sesion-1', userId: 'user-1', clientId: 'client-1' };
      const mockSesion = {
        idSesion: 'sesion-1',
        estado: 'A',
        refreshTokenHash: 'hash_guardado',
      } as any;

      tokenService.verifyRefreshToken.mockResolvedValue(payload as any);
      sesionService.findById.mockResolvedValue(mockSesion);
      jest.spyOn(service, 'comparePassword').mockResolvedValue(true);

      await service.logout(refreshToken, mockReq);

      expect(mockSesion.estado).toBe(EstadosSesion.INVALIDA);
      expect(mockSesion.refreshTokenHash).toBe('');
      expect(sesionService.updateSesion).toHaveBeenCalledWith(
        mockSesion,
        queryRunner.manager,
      );
      expect(operacionService.create).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: TipoOperacion.CERRAR_SESION }),
        queryRunner.manager,
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  })
  /**
   * MÉTODO SOLICITAR RECUPERACIÓN DE CONTRASEÑA
  */
  describe('solicitarRecuperarContraseña', () => {
    const recuperarDTO = { correo: 'test@example.com' };
    const cliente = { idCliente: 'client-1' } as Cliente;

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      usuarioService.findUsuarioByEmailAndCliente.mockResolvedValue(null);

      await expect(
        service.solicitarRecuperarContraseña(recuperarDTO, cliente, mockReq),
      ).rejects.toThrow(new NotFoundException('No existe un usuario con ese correo'));
    });

    it('debe generar y retornar el token de recuperación', async () => {
      const mockUser = { idUsuario: 'user-1' } as any;
      usuarioService.findUsuarioByEmailAndCliente.mockResolvedValue(mockUser);
      tokenService.generateRecuperarToken.mockReturnValue('recovery_token');

      const res = await service.solicitarRecuperarContraseña(
        recuperarDTO,
        cliente,
        mockReq,
      );

      expect(res).toBe('recovery_token');
      expect(usuarioService.solicitudCambioContraseña).toHaveBeenCalledWith(
        mockUser,
        'recovery_token',
        mockReq,
      );
    });
  });
  /**
   * Metodo confirmar cambio de contraseña
   */
  describe('confirmarCambioContraseña', () => {
    const cambioDTO = { contraseña: 'newPassword123' };

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      usuarioService.findUsuarioById.mockResolvedValue(null);

      await expect(
        service.confirmarCambioContraseña('user-1', cambioDTO, mockReq),
      ).rejects.toThrow(new NotFoundException('Usuario no encontrado'));
    });

    it('debe lanzar ConflictException si el usuario no está verificado', async () => {
      usuarioService.findUsuarioById.mockResolvedValue({
        idUsuario: 'user-1',
        verificado: false,
      } as any);

      await expect(
        service.confirmarCambioContraseña('user-1', cambioDTO, mockReq),
      ).rejects.toThrow(new ConflictException('Usuario no verificado'));
    });

    it('debe actualizar la contraseña y confirmar la transacción', async () => {
      const mockUser = {
        idUsuario: 'user-1',
        idCliente: 'client-1',
        verificado: true,
      } as any;

      usuarioService.findUsuarioById.mockResolvedValue(mockUser);
      jest.spyOn(service, 'hashPassword').mockResolvedValue('new_hash');

      await service.confirmarCambioContraseña('user-1', cambioDTO, mockReq);

      expect(mockUser.contraseña).toBe('new_hash');
      expect(mockUser.estado).toBe(EstadosEntidades.ALTA);
      expect(operacionService.create).toHaveBeenCalledWith(
        expect.objectContaining({ tipo: TipoOperacion.CAMBIAR_CONTRASENA }),
        queryRunner.manager,
      );
      expect(usuarioService.saveUsuario).toHaveBeenCalledWith(mockUser);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});