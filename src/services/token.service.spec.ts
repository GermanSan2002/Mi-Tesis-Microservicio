import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource, QueryRunner } from 'typeorm';
import { TokenService, AccessTokenPayload, RefreshTokenPayload, RecuperarContraseñaPayload } from './token.service';
import { UsuarioService } from './usuario.service';
import { SesionService } from './sesion.service';
import { TipoUsuario } from '../entities/tipo-usuario.enum';

describe('TokenService', () => {
    let service: TokenService;
    let usuarioService: jest.Mocked<UsuarioService>;
    let sesionService: jest.Mocked<SesionService>;
    let jwtService: jest.Mocked<JwtService>;
    let dataSource: DataSource;
    let queryRunner: QueryRunner;

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

        // 2. Mocks de servicios inyectados
        usuarioService = {
            findUsuarioById: jest.fn(),
        } as unknown as jest.Mocked<UsuarioService>;

        sesionService = {
            validateSession: jest.fn(),
        } as unknown as jest.Mocked<SesionService>;

        jwtService = {
            sign: jest.fn(),
            verify: jest.fn(),
        } as unknown as jest.Mocked<JwtService>;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TokenService,
                { provide: UsuarioService, useValue: usuarioService },
                { provide: SesionService, useValue: sesionService },
                { provide: JwtService, useValue: jwtService },
                { provide: DataSource, useValue: dataSource },
            ],
        }).compile();

        service = module.get<TokenService>(TokenService);
        jest.clearAllMocks();
    });

    it('debe estar definido el servicio', () => {
        expect(service).toBeDefined();
    });

    // =========================================================================
    // GENERACIÓN DE TOKENS
    // =========================================================================
    describe('Generación de Tokens', () => {
        const mockUser: any = {
            idUsuario: 'user-1',
            idCliente: 'client-1',
            cliente: { idCliente: 'client-1' },
            tipo: TipoUsuario.CLIENTE,
            correo: 'test@example.com',
            roles: [{ nombre: 'Admin' }, { nombre: 'User' }],
        };
        const sesionId = 'sesion-123';

        it('debe generar un AccessToken correctamente mapeando el payload y roles', () => {
            jwtService.sign.mockReturnValue('mock_access_token' as never);

            const token = service.generateAccessToken(mockUser, sesionId);

            expect(token).toBe('mock_access_token');
            expect(jwtService.sign).toHaveBeenCalledWith(
                {
                    userId: 'user-1',
                    idCliente: 'client-1',
                    tipo: TipoUsuario.CLIENTE,
                    sesionId: 'sesion-123',
                    roles: ['Admin', 'User'],
                },
                { expiresIn: '1h' },
            );
        });

        it('debe generar un RefreshToken con su secreto independiente', () => {
            jwtService.sign.mockReturnValue('mock_refresh_token' as never);

            const token = service.generateRefreshToken(mockUser, sesionId);

            expect(token).toBe('mock_refresh_token');
            expect(jwtService.sign).toHaveBeenCalledWith(
                {
                    userId: 'user-1',
                    clientId: 'client-1',
                    sesionId: 'sesion-123',
                },
                expect.objectContaining({
                    expiresIn: '7d',
                }),
            );
        });

        it('debe generar un token de recuperación de contraseña', () => {
            jwtService.sign.mockReturnValue('mock_recovery_token' as never);

            const token = service.generateRecuperarToken(mockUser);

            expect(token).toBe('mock_recovery_token');
            expect(jwtService.sign).toHaveBeenCalledWith(
                {
                    userId: 'user-1',
                    clientId: 'client-1',
                    correo: 'test@example.com',
                },
                expect.objectContaining({
                    expiresIn: '30m',
                }),
            );
        });
    });

    // =========================================================================
    // VERIFICACIÓN DE TOKENS
    // =========================================================================
    describe('Verificación de Tokens', () => {
        const token = 'valid.jwt.token';

        describe('verifyAccessToken', () => {
            it('debe verificar el AccessToken y validar la sesión exitosamente', async () => {
                const payload: AccessTokenPayload = {
                    userId: 'user-1',
                    idCliente: 'client-1',
                    tipo: TipoUsuario.CLIENTE,
                    sesionId: 'sesion-1',
                    roles: ['Admin'],
                };

                jwtService.verify.mockReturnValue(payload as never);
                (sesionService.validateSession as jest.Mock).mockResolvedValue(undefined as never);

                const result = await service.verifyAccessToken(token);

                expect(result).toEqual(payload);
                expect(jwtService.verify).toHaveBeenCalledWith(token, expect.any(Object));
                expect(sesionService.validateSession).toHaveBeenCalledWith('sesion-1', 'user-1');
            });

            it('debe lanzar UnauthorizedException si falla la verificación o la sesión es inválida', async () => {
                jwtService.verify.mockImplementation(() => {
                    throw new Error('Token expired');
                });

                await expect(service.verifyAccessToken(token)).rejects.toThrow(
                    new UnauthorizedException('Invalid or expired access token'),
                );
            });
        });

        describe('verifyRefreshToken', () => {
            it('debe verificar el RefreshToken y validar la sesión exitosamente', async () => {
                const payload: RefreshTokenPayload = {
                    userId: 'user-1',
                    clientId: 'client-1',
                    sesionId: 'sesion-1',
                };

                jwtService.verify.mockReturnValue(payload as never);
                (sesionService.validateSession as jest.Mock).mockResolvedValue(undefined as never);

                const result = await service.verifyRefreshToken(token);

                expect(result).toEqual(payload);
                expect(sesionService.validateSession).toHaveBeenCalledWith('sesion-1', 'user-1');
            });

            it('debe lanzar UnauthorizedException si el refresh token es inválido', async () => {
                jwtService.verify.mockImplementation(() => {
                    throw new Error('Invalid signature');
                });

                await expect(service.verifyRefreshToken(token)).rejects.toThrow(
                    new UnauthorizedException('Invalid or expired refresh token'),
                );
            });
        });

        describe('verifyRecuperarToken', () => {
            it('debe verificar el token de recuperación correctamente', async () => {
                const payload: RecuperarContraseñaPayload = {
                    userId: 'user-1',
                    clientId: 'client-1',
                    correo: 'test@example.com',
                };

                jwtService.verify.mockReturnValue(payload as never);

                const result = await service.verifyRecuperarToken(token);

                expect(result).toEqual(payload);
            });

            it('debe lanzar UnauthorizedException si el token de recuperación falla', async () => {
                jwtService.verify.mockImplementation(() => {
                    throw new Error('Malformed token');
                });

                await expect(service.verifyRecuperarToken(token)).rejects.toThrow(
                    new UnauthorizedException('Invalid or expired token'),
                );
            });
        });
    });

    // =========================================================================
    // REFRESCAR ACCESS TOKEN (TRANSACCIONAL)
    // =========================================================================
    describe('refreshAccessToken', () => {
        const refreshToken = 'valid.refresh.token';

        it('debe renovar el AccessToken exitosamente bajo una transacción', async () => {
            const decodedPayload: RefreshTokenPayload = {
                userId: 'user-1',
                clientId: 'client-1',
                sesionId: 'sesion-1',
            };
            const mockUser = {
                idUsuario: 'user-1',
                idCliente: 'client-1',
                cliente: { idCliente: 'client-1' }
            } as any;

            jwtService.verify.mockReturnValue(decodedPayload as never);
            usuarioService.findUsuarioById.mockResolvedValue(mockUser);
            (sesionService.validateSession as jest.Mock).mockResolvedValue(undefined as never);

            // Simula la llamada interna a generateAccessToken
            jest.spyOn(service, 'generateAccessToken').mockReturnValue('new_access_token');

            const newAccessToken = await service.refreshAccessToken(refreshToken);

            expect(queryRunner.connect).toHaveBeenCalled();
            expect(queryRunner.startTransaction).toHaveBeenCalled();
            expect(usuarioService.findUsuarioById).toHaveBeenCalledWith('user-1', queryRunner.manager);
            expect(sesionService.validateSession).toHaveBeenCalledWith('sesion-1', 'user-1', queryRunner.manager);
            expect(queryRunner.commitTransaction).toHaveBeenCalled();
            expect(queryRunner.release).toHaveBeenCalled();
            expect(newAccessToken).toBe('new_access_token');
        });

        it('debe hacer rollback y lanzar UnauthorizedException si el usuario no existe', async () => {
            const decodedPayload: RefreshTokenPayload = {
                userId: 'user-1',
                clientId: 'client-1',
                sesionId: 'sesion-1',
            };

            jwtService.verify.mockReturnValue(decodedPayload as never);
            usuarioService.findUsuarioById.mockResolvedValue(null);

            await expect(service.refreshAccessToken(refreshToken)).rejects.toThrow(
                new UnauthorizedException('Invalid or expired refresh token'),
            );

            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(queryRunner.release).toHaveBeenCalled();
        });

        it('debe hacer rollback ante cualquier fallo en la validación o transaccionalidad', async () => {
            jwtService.verify.mockImplementation(() => {
                throw new Error('Expired refresh token');
            });

            await expect(service.refreshAccessToken(refreshToken)).rejects.toThrow(
                new UnauthorizedException('Invalid or expired refresh token'),
            );

            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(queryRunner.release).toHaveBeenCalled();
        });
    });
});