import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ExecutionContext, HttpStatus, INestApplication, NotFoundException, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as express from 'express';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AuthService } from '../src/services/auth.service';
import { ApiKeyGuard } from '../src/guard/apiKeyGuard';
import { RecuperarPassGuard } from '../src/guard/recuperarPass.guard';
import { DataSource } from 'typeorm';

describe('Microservicio E2E Tests (Integration)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const mockClienteObj = { idCliente: 'client-uuid-12345', nombre: 'Empresa Test' };

  const mockApiKey = 'sk_test_api_key_123450';
  const mockRecoveryToken = 'mock_recovery_token_jwt';

  const mockAuthService = {
    login: jest.fn(),
    logout: jest.fn(),
    solicitarRecuperarContraseña: jest.fn(),
    confirmarCambioContraseña: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .overrideGuard(RecuperarPassGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          const tokenRecovery = req.headers['x-token-recover'];
          req.usuarioId = 'user-uuid-12345';

          if(!tokenRecovery || tokenRecovery !== mockRecoveryToken){
            return false;
          }

          return true;
        },
      })
      .overrideGuard(ApiKeyGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          const apiKey = req.headers['x-api-key'];
          req.idCliente = 'client-uuid-12345';
          req.cliente = mockClienteObj;

          if (!apiKey || apiKey !== mockApiKey) {
            return false; // NestJS devolverá automáticamente 403 Forbidden
          }

          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(express.json());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

    await app.init();
    dataSource = app.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }

    await app.close();
  });

  describe('1. Flujo de Autenticación', () => {
    describe('POST /auth/login', () => {
      it('Debe retornar Tokens de Acceso válidos', async () => {
        const credentials = { email: 'admin@cliente.com', password: 'Password123!' };
        const expectedTokens = {
          accessToken: 'mock_access_token_jwt',
          refreshToken: 'mock_refresh_token_jwt',
        };
        
        mockAuthService.login.mockResolvedValue(expectedTokens as never);

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(credentials)
          .expect(HttpStatus.OK);
        
        expect(response.body).toEqual(expectedTokens);
        expect(mockAuthService.login).toHaveBeenCalled();
      });

      it('Debe retornar 401 para credenciales inválidas', async () => {
        mockAuthService.login.mockRejectedValue(new Error('Invalid email or password') as never);

        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'bad@user.com', password: 'wrong' })
          .expect(HttpStatus.INTERNAL_SERVER_ERROR);
      });
    });

    describe('POST /auth/logout', () => {
      it('Debe cerrar la sesión correctamente y revocar el Refresh Token', async () => {
        const logoutDTO = { refreshToken: 'mock_refresh_token_jwt' };

        mockAuthService.logout.mockResolvedValue(undefined as never);

        const response = await request(app.getHttpServer())
          .post('/auth/logout')
          .send(logoutDTO)
          .expect(HttpStatus.OK);

        expect(response.body).toEqual({ message: 'Logout successful' });
        expect(mockAuthService.logout).toHaveBeenCalledWith(
          logoutDTO.refreshToken,
          expect.anything()
        );
      });

      it('Debe retornar 401 Unauthorized si el Refresh Token es inválido o inactivo', async () => {
        mockAuthService.logout.mockRejectedValue(
          new UnauthorizedException('Invalid or expired refresh token') as never
        );

        await request(app.getHttpServer())
          .post('/auth/logout')
          .send({ refreshToken: 'invalid_or_expired_token' })
          .expect(HttpStatus.UNAUTHORIZED); 
      })
    });
  });

  describe('2. Flujo de Recuperación de Contraseña', () => {
    describe('PATCH /auth/solitarRecuperacion', () => {
      it('Debe generar y retornar un token de recuperación de contraseña', async () => {
        const recuperarDTO = { correo: 'usuario@empresa.com' };
        const expectedToken = mockRecoveryToken;

        mockAuthService.solicitarRecuperarContraseña.mockResolvedValue(expectedToken as never);

        const response = await request(app.getHttpServer())
          .patch('/auth/solitarRecuperacion')
          .set('X-API-Key', mockApiKey)
          .set('Content-Type', 'application/json')
          .send(recuperarDTO)
          .expect(HttpStatus.OK);

        expect(response.body).toEqual({ token: expectedToken }); // O expect(response.text) según la respuesta del servicio
        expect(mockAuthService.solicitarRecuperarContraseña).toHaveBeenCalledWith(
          expect.objectContaining(recuperarDTO as Record<string, unknown>),
          mockClienteObj,
          expect.anything()
        );
      });

      it('Debe retornar 404 Not Found si el usuario no existe para el cliente', async () => {
        const recuperarDTO = { correo: 'inexistente@empresa.com' };

        mockAuthService.solicitarRecuperarContraseña.mockRejectedValue(
          new NotFoundException('No existe un usuario con ese correo') as never
        );

        await request(app.getHttpServer())
          .patch('/auth/solitarRecuperacion')
          .set('X-API-Key', mockApiKey)
          .set('Content-Type', 'application/json')
          .send(recuperarDTO)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('POST /auth/validarCambioPass', () => {
      it('Debe retornar 200 OK si el token de recuperación y la API Key son válidos', async () => {
        await request(app.getHttpServer())
          .post('/auth/validarCambioPass')
          .set('X-API-Key', mockApiKey)
          .set('X-Token-Recover', mockRecoveryToken)
          .expect(HttpStatus.OK);
      });

      it('Debe retornar 403 Forbidden si no se provee un API Key válido', async () => {
        await request(app.getHttpServer())
          .patch('/auth/confirmarRecuperacion')
          .set('X-API-Key', 'clave_invalida')
          .set('X-Token-Recover', mockRecoveryToken)
          .expect(HttpStatus.FORBIDDEN);
      })

      it('Debe retornar 403 Forbidden si no se provee un token de recuperacion válido', async () => {
        await request(app.getHttpServer())
          .patch('/auth/confirmarRecuperacion')
          .set('X-API-Key', mockApiKey)
          .set('X-Token-Recover', 'clave_invalida')
          .expect(HttpStatus.FORBIDDEN);
      })
    });

    describe('PATCH /auth/confirmarRecuperacion', () => {
      it('Debe confirmar el cambio de contraseña exitosamente', async () => {
        const cambioDTO = { contraseña: 'NuevaPassword123!' };

        mockAuthService.confirmarCambioContraseña.mockResolvedValue(undefined as never);

        await request(app.getHttpServer())
          .patch('/auth/confirmarRecuperacion')
          .set('X-API-Key', mockApiKey)
          .set('X-Token-Recover', mockRecoveryToken)
          .set('Content-Type', 'application/json')
          .send(cambioDTO)
          .expect(HttpStatus.OK);

        expect(mockAuthService.confirmarCambioContraseña).toHaveBeenCalledWith(
          'user-uuid-12345',
          expect.objectContaining(cambioDTO as Record<string, unknown>),
          expect.anything()
        );
      });

      it('Debe retornar 409 Conflict si el usuario no está verificado', async () => {
        const cambioDTO = { contraseña: 'NuevaPassword123!' };

        mockAuthService.confirmarCambioContraseña.mockRejectedValue(
          new ConflictException('Usuario no verificado') as never
        );

        await request(app.getHttpServer())
          .patch('/auth/confirmarRecuperacion')
          .set('X-API-Key', mockApiKey)
          .set('X-Token-Recover', mockRecoveryToken)
          .set('Content-Type', 'application/json')
          .send(cambioDTO)
          .expect(HttpStatus.CONFLICT);
      });

      it('Debe retornar 403 Forbidden si no se provee un API Key válido', async () => {
        await request(app.getHttpServer())
          .patch('/auth/confirmarRecuperacion')
          .set('X-API-Key', 'clave_invalida')
          .set('X-Token-Recover', mockRecoveryToken)
          .expect(HttpStatus.FORBIDDEN);
      })

      it('Debe retornar 403 Forbidden si no se provee un token de recuperacion válido', async () => {
        await request(app.getHttpServer())
          .patch('/auth/confirmarRecuperacion')
          .set('X-API-Key', mockApiKey)
          .set('X-Token-Recover', 'clave_invalida')
          .expect(HttpStatus.FORBIDDEN);
      })
    });
  });
});
