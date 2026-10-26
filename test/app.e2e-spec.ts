import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { UsuarioService } from '../src/services/usuario.service';
import { ClienteService } from '../src/services/cliente.service';
import { PlanesSuscripcion } from '../src/entities/planes-suscripcion.enum';
import { TipoUsuario } from '../src/entities/tipo-usuario.enum';
import { EstadosEntidades } from '../src/entities/estadosEntidades';
import { RolService } from '../src/services/rol.service';
import { Rol } from '../src/entities/rol.entity';
import { Usuario } from '../src/entities/usuario.entity';
import { ClienteModule } from 'src/modules/cliente.module';

jest.setTimeout(15000);

describe('Microservicio E2E Tests (Integration)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  let accessToken: string;
  let refreshToken: string;
  let testApiKey: string;
  let testIdCliente: string;
  let recuperarToken: string;

  let rolesPrueba: Rol[];
  let usuarioPrueba: Usuario;
  let usuarioPruebaPass: string;
  let usuarioAdmin: Usuario;

  let usuarioService: UsuarioService;
  let clienteService: ClienteService;
  let rolService: RolService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(express.json());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get<DataSource>(DataSource);

    if (!dataSource.isInitialized) {
      throw new Error('La conexión a la base de datos de pruebas no está inicializada.');
    }

    if (dataSource.options.database !== 'users-test') {
      throw new Error(
        `Base de datos incorrecta para E2E: ${dataSource.options.database}. Se esperaba users-test.`,
      );
    }

    await dataSource.synchronize(true);

    clienteService = app.get(ClienteService);
    usuarioService = app.get(UsuarioService);
    rolService = app.get(RolService);

    const clientResponse = await clienteService.registrarCliente({
      nombre: 'Empresa Test E2E',
      mailContacto: 'contacto@empresatest.com',
      plan: PlanesSuscripcion.ORO,
    });
    testApiKey = clientResponse.apiKey;
    testIdCliente = clientResponse.cliente.idCliente;

    usuarioAdmin = await usuarioService.saveUsuarioHashPassword({
      correo: 'admin@empresatest.com',
      contraseña: 'Password123!',
      tipo: TipoUsuario.SUPER_ADMINISTRADOR,
      estado: EstadosEntidades.ALTA,
      verificado: true,
      cliente: clientResponse.cliente,
    } as any);

    await rolService.createRol(
      {
        descripcion: "Rol vendedor",
        nombre: "Vendedor"
      } as any,
      clientResponse.cliente
    );

    await rolService.createRol(
      {
        descripcion: "Rol Repositor",
        nombre: "Repositor"
      } as any,
      clientResponse.cliente
    )
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }

    await app.close();
  });

  it('Debe levantar la aplicación conectada a la DB de test (users-test)', () => {
    expect(app).toBeDefined();
    expect(dataSource.options.database).toBe('users-test');
  });

  describe('AuthModule', () => {
    describe('Flujo de Login y Seguridad', () => {
      describe('/auth/login (POST)', () => {
        it('Debe iniciar sesión y retornar tokens reales', async () => {
          const response = await request(app.getHttpServer())
            .post('/auth/login')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send({ email: 'admin@empresatest.com', password: 'Password123!' })
            .expect(HttpStatus.OK);

          expect(response.body).toHaveProperty('accessToken');
          expect(response.body).toHaveProperty('refreshToken');

          accessToken = response.body.accessToken;
          refreshToken = response.body.refreshToken;
        })

        it('Debe retornar 401 Unauthorized para credenciales inválidas', async () => {
          await request(app.getHttpServer())
            .post('/auth/login')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send({ email: 'admin@empresatest.com', password: 'ClaveIncorrecta!' })
            .expect(HttpStatus.UNAUTHORIZED);
        });

        it('Debe retornar 401 Unauthorized para api key invalida', async () => {
          await request(app.getHttpServer())
            .post('/auth/login')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', "clave invalida")
            .send({ email: 'admin@empresatest.com', password: 'Password123!' })
            .expect(HttpStatus.UNAUTHORIZED);
        })
      })
    })

    describe('Flujo de Logout con refresh token', () => {
      describe('/auth/logout (POST)', () => {
        it('Debe cerrar la sesion', async () => {
          const response = await request(app.getHttpServer())
            .post('/auth/logout')
            .send({ refreshToken: refreshToken })
            .expect(HttpStatus.OK);

          expect(response.body).toEqual({ message: 'Logout successful' });

          // Volver a levantar la sesion para pruebas futuras
          const response2 = await request(app.getHttpServer())
            .post('/auth/login')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send({ email: 'admin@empresatest.com', password: 'Password123!' })
            .expect(HttpStatus.OK);

          accessToken = response2.body.accessToken;
          refreshToken = response2.body.refreshToken;
        })

        it('Debe retornar 401 Unauthorized para token invalido', async () => {
          await request(app.getHttpServer())
            .post('/auth/logout')
            .send({ refreshToken: "Token invalido" })
            .expect(HttpStatus.UNAUTHORIZED);
        })
      })
    });

    describe('Flujo de verificacion y refresco de Tokens de acceso', () => {
      describe('/auth/checkAuth (POST)', () => {
        it('Debe retornar la decodificacion del Token de acceso', async () => {
          const response = await request(app.getHttpServer())
            .post('/auth/checkAuth')
            .send({ token: accessToken })
            .expect(HttpStatus.OK);

          expect(response.body).toHaveProperty('decoded');
          expect(response.body.decoded).toHaveProperty('userId');
        });

        it('Debe retornar 401 Unauthorized para token invalido', async () => {
          await request(app.getHttpServer())
            .post('/auth/checkAuth')
            .send({ token: "token invalido" })
            .expect(HttpStatus.UNAUTHORIZED);
        })
      });

      describe('/auth/refresh (POST)', () => {
        it('Debe otorgar un nuevo Token de Acceso usando el de Refresco', async () => {
          const response = await request(app.getHttpServer())
            .post('/auth/refresh')
            .send({ refreshToken: refreshToken })
            .expect(HttpStatus.OK);

          expect(response.body).toHaveProperty('accessToken');

          accessToken = response.body.accessToken;
        });

        it('Debe retornar 401 Unauthorized para token invalido', async () => {
          await request(app.getHttpServer())
            .post('/auth/refresh')
            .send({ refreshToken: "token invalido" })
            .expect(HttpStatus.UNAUTHORIZED);
        });
      });
    });

    describe('Flujo de recuperacion de contraseña', () => {
      describe('/auth/solitarRecuperacion (PATCH)', () => {
        it('Debe otorgar un token para recuperar contraseña', async () => {
          const response = await request(app.getHttpServer())
            .patch('/auth/solitarRecuperacion')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send({ correo: 'admin@empresatest.com' })
            .expect(HttpStatus.OK);

          expect(response.body).toHaveProperty('token');

          recuperarToken = response.body.token;
        });

        it('Debe retornar 404 NOT_FOUND para correo invalido', async () => {
          await request(app.getHttpServer())
            .patch('/auth/solitarRecuperacion')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send({ correo: 'noexiste@empresatest.com' })
            .expect(HttpStatus.NOT_FOUND);
        });

        it('Debe retornar 401 UNAUTHORIZED para api key invalida', async () => {
          await request(app.getHttpServer())
            .patch('/auth/solitarRecuperacion')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', "api key invalida")
            .send({ correo: 'admin@empresatest.com' })
            .expect(HttpStatus.UNAUTHORIZED);
        });
      });

      describe('/auth/validarCambioPass (POST)', () => {
        it('Debe validar el token de recuperacion', async () => {
          const response = await request(app.getHttpServer())
            .post('/auth/validarCambioPass')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .set('X-Token-Recover', recuperarToken)
            .expect(HttpStatus.OK);

          expect(response.body).toEqual({ message: 'Token válido' });
        });

        it('Debe retornar 401 UNAUTHORIZED para api key invalida', async () => {
          await request(app.getHttpServer())
            .post('/auth/validarCambioPass')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', "api key invalida")
            .set('X-Token-Recover', recuperarToken)
            .expect(HttpStatus.UNAUTHORIZED);
        });

        it('Debe retornar 401 UNAUTHORIZED para token invalido', async () => {
          await request(app.getHttpServer())
            .post('/auth/validarCambioPass')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .set('X-Token-Recover', "token invalido")
            .expect(HttpStatus.UNAUTHORIZED);
        })
      });

      describe('/auth/confirmarRecuperacion (PATCH)', () => {
        it('Debe confirmar el cambio de contraseña', async () => {
          const response = await request(app.getHttpServer())
            .patch('/auth/confirmarRecuperacion')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .set('X-Token-Recover', recuperarToken)
            .send({ contraseña: 'passwordNew123!' })
            .expect(HttpStatus.OK);

          expect(response.body).toEqual({ message: 'Contraseña cambiada exitosamente' });

          //se cierra la sesion actual
          await request(app.getHttpServer())
            .post('/auth/logout')
            .send({ refreshToken: refreshToken })

          //Se inicia sesion con la contraseña nueva
          const login = await request(app.getHttpServer())
            .post('/auth/login')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send({ email: 'admin@empresatest.com', password: 'passwordNew123!' })
            .expect(HttpStatus.OK);

          accessToken = login.body.accessToken;
          refreshToken = login.body.refreshToken;
        });

        it('Debe retornar 401 UNAUTHORIZED para api key invalida', async () => {
          await request(app.getHttpServer())
            .patch('/auth/confirmarRecuperacion')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', "api key invalida")
            .set('X-Token-Recover', recuperarToken)
            .send({ contraseña: 'passwordNew123!' })
            .expect(HttpStatus.UNAUTHORIZED);
        });

        it('Debe retornar 401 UNAUTHORIZED para token invalido', async () => {
          await request(app.getHttpServer())
            .patch('/auth/confirmarRecuperacion')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .set('X-Token-Recover', "token invalido")
            .send({ contraseña: 'passwordNew123!' })
            .expect(HttpStatus.UNAUTHORIZED);
        });
      });
    });
  });

  describe('RolModule', () => {
    describe('Flujo de creacion de roles de para un cliente', () => {
      describe('/roles/crear-rol (POST)', () => {
        it('Debe crear un rol para el cliente', async () => {
          const rolDto = {
            descripcion: "Rol limpiador",
            nombre: "Limpiador"
          };

          const response = await request(app.getHttpServer())
            .post('/roles/crear-rol')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send(rolDto)
            .expect(HttpStatus.CREATED);

          expect(response.body).toBeDefined();
          expect(response.body).toHaveProperty('nombre', rolDto.nombre);
        });

        it('Debe retornar 401 Unauthorized para api key invalida', async () => {
          const rolDto = {
            descripcion: "Rol limpiador",
            nombre: "Limpiador"
          };

          await request(app.getHttpServer())
            .post('/roles/crear-rol')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', "api key invalida")
            .send(rolDto)
            .expect(HttpStatus.UNAUTHORIZED);
        });
      })
    });

    describe('Flujo de consulta de roles para un cliente', () => {
      describe('/roles/get-roles (GET)', () => {
        it('Debe retornar los roles del cliente', async () => {
          const response = await request(app.getHttpServer())
            .get('/roles/get-roles')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .expect(HttpStatus.OK);

          expect(response.body).toBeDefined();

          //guardo roles para pruebas futuras
          rolesPrueba = response.body as Rol[];
        });

        it('Debe retornar 401 Unauthorized para api key invalida', async () => {
          await request(app.getHttpServer())
            .get('/roles/get-roles')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', "api key invalida")
            .expect(HttpStatus.UNAUTHORIZED);
        })
      });
    });
  });

  describe('UserModule', () => {
    describe('Flujo de registro de usuario para cliente', () => {
      describe('/users/registrar-usuario (POST)', () => {
        it('Debe registrar un usuario correctamente', async () => {
          const usuarioDTO = {
            contraseña: 'Password123!',
            correo: 'usuario@empresatest.com',
            parametros: {
              telefono: '1122334455',
              nombre: 'Usuario',
              apellido: 'Prueba'
            },
            roles: [rolesPrueba[0].idRol, rolesPrueba[1].idRol]
          };

          const response = await request(app.getHttpServer())
            .post('/users/registrar-usuario')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send(usuarioDTO)
            .expect(HttpStatus.CREATED);

          expect(response.body).toBeDefined();
          expect(response.body).toHaveProperty('correo', usuarioDTO.correo);
          expect(response.body).toHaveProperty('parametros');
          expect(response.body.parametros).toEqual(usuarioDTO.parametros);

          expect(response.body.contraseña).not.toBe(usuarioDTO.contraseña);

          //guardo usuario para pruebas futuras
          usuarioPrueba = response.body as Usuario;
          usuarioPruebaPass = 'Password123!';
        });

        it('Debe retornar 409 CONFLICT si ya hay un usuario registrado para el cliente con ese correo', async () => {
          const usuarioDTO = {
            contraseña: 'Password123!',
            correo: 'usuario@empresatest.com',
            parametros: {
              telefono: '1122334455',
              nombre: 'Usuario',
              apellido: 'Prueba'
            }
          };

          await request(app.getHttpServer())
            .post('/users/registrar-usuario')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send(usuarioDTO)
            .expect(HttpStatus.CONFLICT);
        });

        it('Debe retornar 400 BAD_REQUEST si se proporciona un rol inexistente', async () => {
          const usuarioDTO = {
            contraseña: 'Password123!',
            correo: 'usuario2@empresatest.com',
            parametros: {
              telefono: '1122334455',
              nombre: 'Usuario',
              apellido: 'Prueba'
            },
            roles: [rolesPrueba[0].idRol, "rol inexistente"]
          };

          await request(app.getHttpServer())
            .post('/users/registrar-usuario')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send(usuarioDTO)
            .expect(HttpStatus.BAD_REQUEST);
        });

        it('Debe retornar 401 Unauthorized para api key invalida', async () => {
          const usuarioDTO = {
            contraseña: 'Password123!',
            correo: 'usuario2@empresatest.com',
            parametros: {
              telefono: '1122334455',
              nombre: 'Usuario',
              apellido: 'Prueba'
            },
            roles: [rolesPrueba[0].idRol]
          };

          await request(app.getHttpServer())
            .post('/users/registrar-usuario')
            .set('Content-Type', 'application/json')
            .set('X-API-Key', "api key invalida")
            .send(usuarioDTO)
            .expect(HttpStatus.UNAUTHORIZED);
        })
      });
    });

    describe('Flujo de verificacion de usuario', () => {
      describe('/users/:idUsuario/verify (PATCH)', () => {
        it('Debe establecer un usuario como verificado', async () => {
          const idPrueba = usuarioPrueba.idUsuario;

          const response = await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/verify`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .expect(HttpStatus.OK);

          expect(response.body).toEqual({ message: "Usuario verificado" });
          usuarioPrueba.verificado = true;
        });

        it('Debe arrojar error 404 NOT_FOUND si el usuario no existe', async () => {
          const idPrueba = "no existe";

          await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/verify`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .expect(HttpStatus.NOT_FOUND);
        });

        it('Debe arrojar error 409 CONFLICT si el usuario ya esta verificado', async () => {
          const idPrueba = usuarioPrueba.idUsuario;

          await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/verify`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .expect(HttpStatus.CONFLICT);
        });

        it('Debe arrojar 401 UNAUTHORIZED para api key invalida', async () => {
          const idPrueba = usuarioPrueba.idUsuario;

          await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/verify`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', "api key invalida")
            .expect(HttpStatus.UNAUTHORIZED);
        });
      });
    });

    describe('Flujo de asignacion y remocion de roles a usuario', () => {
      describe('/users/:idUsuario/asign-roles (PATCH)', () => {
        it('Debe agregar los roles indicados al usuario', async () => {
          const idPrueba = usuarioPrueba.idUsuario;

          const rolNuevo = rolesPrueba[2];

          // Guardar los roles que tenía el usuario antes de la petición.
          const idsRolesAnteriores = usuarioPrueba.roles.map(
            rol => rol.idRol,
          );

          const rolesDTO = {
            roles: [rolesPrueba[2].idRol]
          };

          const response = await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/asign-roles`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send(rolesDTO)
            .expect(HttpStatus.OK);

          // Verificar que se devuelve un usuario.
          expect(response.body).toBeDefined();
          expect(response.body.idUsuario).toBe(idPrueba);

          // Verificar que se conservan los roles anteriores.
          for (const idRol of idsRolesAnteriores) {
            expect(response.body.roles.map(rol => rol.idRol)).toContain(idRol);
          }

          // Verificar que se añade el nuevo rol.
          expect(response.body.roles.map(rol => rol.idRol)).toContain(
            rolNuevo.idRol,
          );

          // Verificar que el rol no aparece duplicado.
          const idsRolesFinales = response.body.roles.map(rol => rol.idRol);

          expect(new Set(idsRolesFinales).size).toBe(idsRolesFinales.length);

          usuarioPrueba = response.body;
        });

        it('Debe arrojar 404 NOT_FOUND si el usuario no existe', async () => {
          const idPrueba = "no existe";

          const rolesDTO = {
            roles: [rolesPrueba[2].idRol]
          };

          await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/asign-roles`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send(rolesDTO)
            .expect(HttpStatus.NOT_FOUND);
        });

        it('Debe arrojar 400 BAD_REQUEST si se proporciona un rol que no existe', async () => {
          const idPrueba = usuarioPrueba.idUsuario;

          const rolesDTO = {
            roles: ["no existe"]
          };

          const response = await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/asign-roles`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send(rolesDTO)
            .expect(HttpStatus.BAD_REQUEST);
        });

        it('Debe arrojar 401 UNAUTHORIZED si para api key invalida', async () => {
          const idPrueba = usuarioPrueba.idUsuario;

          const rolesDTO = {
            roles: [rolesPrueba[2].idRol]
          };

          await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/asign-roles`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', "api key invalida")
            .send(rolesDTO)
            .expect(HttpStatus.UNAUTHORIZED);
        });
      });

      describe('/users/:idUsuario/remove-roles (PATCH)', () => {
        it('Debe remover los roles solicitados', async () => {
          const idPrueba = usuarioPrueba.idUsuario;
          const rolARemover = rolesPrueba[2];

          // Guardar los roles iniciales sin modificar la colección original.
          const idsRolesAnteriores = usuarioPrueba.roles.map(
            rol => rol.idRol,
          );

          // Asegurarse de que el rol que se eliminará esté asignado.
          expect(idsRolesAnteriores).toContain(rolARemover.idRol);

          const response = await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/remove-roles`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send({
              roles: [rolARemover.idRol],
            })
            .expect(HttpStatus.OK);

          expect(response.body).toBeDefined();
          expect(response.body.idUsuario).toBe(idPrueba);

          const idsRolesFinales = response.body.roles.map(
            rol => rol.idRol,
          );

          // El rol solicitado ya no debe estar asignado.
          expect(idsRolesFinales).not.toContain(rolARemover.idRol);

          // Los demás roles deben conservarse.
          for (const idRol of idsRolesAnteriores) {
            if (idRol !== rolARemover.idRol) {
              expect(idsRolesFinales).toContain(idRol);
            }
          }

          usuarioPrueba = response.body;
        });

        it('Debe arrojar 404 NOT_FOUND si el usuario no existe', async () => {
          const idPrueba = "No existe";
          const rolARemover = rolesPrueba[2];

          await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/remove-roles`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send({
              roles: [rolARemover.idRol],
            })
            .expect(HttpStatus.NOT_FOUND);
        });

        it('Debe arrojar 400 BAD_REQUEST si se propociona un rol invalido', async () => {
          const idPrueba = usuarioPrueba.idUsuario;
          const rolARemover = "No existe";

          await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/remove-roles`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send({
              roles: [rolARemover],
            })
            .expect(HttpStatus.BAD_REQUEST);
        });

        it('Debe arrojar 401 UNAUTHORIZED si para api key invalida', async () => {
          const idPrueba = usuarioPrueba.idUsuario;
          const rolARemover = rolesPrueba[2];

          const response = await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/remove-roles`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', "Api Key invalida")
            .send({
              roles: [rolARemover.idRol],
            })
            .expect(HttpStatus.UNAUTHORIZED);
        })
      });
    });

    describe('Flujo de consulta de usuarios de cliente', () => {
      describe('/users/cliente (GET)', () => {
        it('Debe obtener los usuarios asociados al cliente con paginación', async () => {
          const response = await request(app.getHttpServer())
            .get('/users/cliente')
            .query({
              page: 1,
              limit: 10,
            })
            .set('X-API-Key', testApiKey)
            .expect(HttpStatus.OK);

          expect(response.body).toEqual(
            expect.objectContaining({
              data: expect.any(Array),
              meta: expect.objectContaining({
                currentPage: 1,
                itemsPerPage: 10,
                totalItems: expect.any(Number),
                totalPages: expect.any(Number),
              }),
            }),
          );

          expect(response.body.data.length).toBeLessThanOrEqual(10);
        });

        it('Debe arrojar 401 UNAUTHORIZED si para api key invalida', async () => {
          await request(app.getHttpServer())
            .get('/users/cliente')
            .query({
              page: 1,
              limit: 10,
            })
            .set('X-API-Key', "testApiKey")
            .expect(HttpStatus.UNAUTHORIZED);
        });
      });

      describe('/users/:idUsuario', () => {
        it('Debe obtener el usuario por su ID', async () => {
          const idPrueba = usuarioPrueba.idUsuario;

          const response = await request(app.getHttpServer())
            .get(`/users/${idPrueba}`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .expect(HttpStatus.OK);

          expect(response.body).toBeDefined();
          expect(response.body.idUsuario).toBe(idPrueba);
        });

        it('Debe arrojar error 404 NOT_FOUND si el usuario no existe', async () => {
          const idPrueba = "usuarioPrueba.idUsuario";

          await request(app.getHttpServer())
            .get(`/users/${idPrueba}`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .expect(HttpStatus.NOT_FOUND);
        })

        it('Debe arrojar error 401 UNAUTHORIZED para api key invalida', async () => {
          const idPrueba = usuarioPrueba.idUsuario;

          await request(app.getHttpServer())
            .get(`/users/${idPrueba}`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', "testApiKey")
            .expect(HttpStatus.UNAUTHORIZED);
        })
      })
    });

    describe('Flujo de alta y baja de usuarios', () => {
      describe('/users/:idUsuario/baja (PATCH)', () => {
        it('Debe dar de baja el usuario', async () => {
          const idPrueba = usuarioPrueba.idUsuario;
          const bajaDTO = {
            motivo: "Baja de usuario",
          }

          const response = await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/baja`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send(bajaDTO)
            .expect(HttpStatus.OK);

          expect(response.body).toBeDefined();
          expect(response.body.idUsuario).toBe(idPrueba);
          expect(response.body.estado).toBe(EstadosEntidades.BAJA);

          usuarioPrueba = response.body;
        });

        it('Debe retornar 404 si el usuario no existe', async () => {
          const idPrueba = "no existe";
          const bajaDTO = {
            motivo: "Baja de usuario",
          }

          await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/baja`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send(bajaDTO)
            .expect(HttpStatus.NOT_FOUND);
        });

        it('Debe retornar 400 BAD_REQUEST si el usuario ya estaba dado de baja', async () => {
          const idPrueba = usuarioPrueba.idUsuario;
          const bajaDTO = {
            motivo: "Baja de usuario",
          }

          await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/baja`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send(bajaDTO)
            .expect(HttpStatus.BAD_REQUEST);
        });

        it('Debe arrojar 401 UNAUTHORIZED para api key invalida', async () => {
          const idPrueba = usuarioPrueba.idUsuario;
          const bajaDTO = {
            motivo: "Baja de usuario",
          }

          await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/baja`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', "testApiKey")
            .send(bajaDTO)
            .expect(HttpStatus.UNAUTHORIZED);
        })
      });

      describe('/users/:idUsuario/alta', () => {
        it('Debe dar de baja el usuario', async () => {
          const idPrueba = usuarioPrueba.idUsuario;
          const altaDTO = {
            motivo: "Alta de usuario",
          }

          const response = await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/alta`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send(altaDTO)
            .expect(HttpStatus.OK);

          expect(response.body).toBeDefined();
          expect(response.body.idUsuario).toBe(idPrueba);
          expect(response.body.estado).toBe(EstadosEntidades.ALTA);

          usuarioPrueba = response.body;
        });

        it('Debe retornar 404 si el usuario no existe', async () => {
          const idPrueba = "no existe";
          const altaDTO = {
            motivo: "Alta de usuario",
          }

          await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/alta`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send(altaDTO)
            .expect(HttpStatus.NOT_FOUND);
        });

        it('Debe retornar 400 BAD_REQUEST si el usuario ya estaba dado de alta', async () => {
          const idPrueba = usuarioPrueba.idUsuario;
          const altaDTO = {
            motivo: "Alta de usuario",
          }

          await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/alta`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', testApiKey)
            .send(altaDTO)
            .expect(HttpStatus.BAD_REQUEST);
        });

        it('Debe arrojar 401 UNAUTHORIZED para api key invalida', async () => {
          const idPrueba = usuarioPrueba.idUsuario;
          const altaDto = {
            motivo: "Baja de usuario",
          }

          await request(app.getHttpServer())
            .patch(`/users/${idPrueba}/alta`)
            .set('Content-Type', 'application/json')
            .set('X-API-Key', "testApiKey")
            .send(altaDto)
            .expect(HttpStatus.UNAUTHORIZED);
        });
      });
    });

    describe('Flujo de modificacion de usuario', () => {
      describe('/users/update/:idUsuario (PATCH)', () => {
        it('Debe actualizar parcialmente los parámetros del usuario', async () => {
          const idPrueba = usuarioPrueba.idUsuario;

          const parametrosActualizados = {
            tema: 'oscuro',
            idioma: 'es',
          };

          const response = await request(app.getHttpServer())
            .patch(`/users/update/${idPrueba}`)
            .set('X-API-Key', testApiKey)
            .send({ parametros: parametrosActualizados })
            .expect(HttpStatus.OK);

          expect(response.body).toEqual(
            expect.objectContaining({
              idUsuario: usuarioPrueba.idUsuario,
              parametros: parametrosActualizados,
            }),
          );

          usuarioPrueba = response.body;
        });

        it('debe permitir conservar el correo actual del usuario', async () => {
          const idPrueba = usuarioPrueba.idUsuario;

          const response = await request(app.getHttpServer())
            .patch(`/users/update/${idPrueba}`)
            .set('X-API-Key', testApiKey)
            .send({ correo: usuarioPrueba.correo })
            .expect(HttpStatus.OK);

          expect(response.body.correo).toBe(usuarioPrueba.correo);
        });

        it('debe permitir cambiar el correo por uno no registrado en el cliente', async () => {
          const idPrueba = usuarioPrueba.idUsuario;

          const nuevoCorreo = 'correo.actualizado@test.com';

          const response = await request(app.getHttpServer())
            .patch(`/users/update/${idPrueba}`)
            .set('X-API-Key', testApiKey)
            .send({ correo: nuevoCorreo })
            .expect(HttpStatus.OK);

          expect(response.body.correo).toBe(nuevoCorreo);

          usuarioPrueba = response.body;
        });

        it('debe rechazar un correo que ya pertenece a otro usuario del cliente', async () => {
          const idPrueba = usuarioPrueba.idUsuario;

          await request(app.getHttpServer())
            .patch(`/users/update/${idPrueba}`)
            .set('X-API-Key', testApiKey)
            .send({ correo: usuarioAdmin.correo })
            .expect(HttpStatus.CONFLICT);
        });

        it('debe rechazar la actualización de un usuario inexistente', async () => {
          const idPrueba = "usuarioPrueba.idUsuario";

          await request(app.getHttpServer())
            .patch(`/users/update/${idPrueba}`)
            .set('X-API-Key', testApiKey)
            .send({ parametros: { prueba: true } })
            .expect(HttpStatus.NOT_FOUND);
        });

        it('debe rechazar una API key inválida', async () => {
          const idPrueba = usuarioPrueba.idUsuario;

          await request(app.getHttpServer())
            .patch(`/users/update/${idPrueba}`)
            .set('X-API-Key', 'api-key-invalida')
            .send({ parametros: { prueba: true } })
            .expect(HttpStatus.UNAUTHORIZED);
        });

        it('debe rechazar un correo con formato inválido', async () => {
          const idPrueba = usuarioPrueba.idUsuario;

          await request(app.getHttpServer())
            .patch(`/users/update/${idPrueba}`)
            .set('X-API-Key', testApiKey)
            .send({ correo: 'correo-no-valido' })
            .expect(HttpStatus.BAD_REQUEST);
        });

        it('debe rechazar propiedades no permitidas en el DTO', async () => {
          const idPrueba = usuarioPrueba.idUsuario;

          await request(app.getHttpServer())
            .patch(`/users/update/${idPrueba}`)
            .set('X-API-Key', testApiKey)
            .send({ propiedadInexistente: 'valor' })
            .expect(HttpStatus.BAD_REQUEST);
        });
      });

      describe('ClienteModule', () => {

      });
    });
  });

  describe('ClienteModule', () => {
    describe('Flujo de registro de un cliente', () => {
      describe('/client/registrar POST', () => {
        it('Debe registrar un cliente y devolver su API key', async () => {
          const response = await request(app.getHttpServer())
            .post('/client/registrar')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              nombre: 'Empresa E2E Nueva',
              mailContacto: 'contacto@nuevaempresa-e2e.com',
              plan: PlanesSuscripcion.PLATA,
            })
            .expect(HttpStatus.CREATED);

          expect(response.body).toHaveProperty('cliente');
          expect(response.body.cliente).toHaveProperty('idCliente');
          expect(response.body.cliente.nombre).toBe('Empresa E2E Nueva');
          expect(response.body.cliente.mailContacto).toBe(
            'contacto@nuevaempresa-e2e.com',
          );
          expect(response.body.cliente.plan).toBe(
            PlanesSuscripcion.PLATA,
          );

          // La API key original se entrega al crear el cliente.
          expect(response.body.apiKey).toEqual(expect.any(String));
          expect(response.body.apiKey).toMatch(/^sk_/);

          // La clave original no debe aparecer como propiedad de la entidad.
          expect(response.body.cliente.apiKey).toBeUndefined();
          expect(response.body.cliente.apiKeyHash).toBeUndefined();
        });

        it('Debe rechazar la petición si no se proporciona JWT', async () => {
          await request(app.getHttpServer())
            .post('/client/registrar')
            .send({
              nombre: 'Empresa Sin Token',
              mailContacto: 'contacto@sintoken.com',
              plan: PlanesSuscripcion.BRONCE,
            })
            .expect(HttpStatus.UNAUTHORIZED);
        });

        it('Debe rechazar un JWT inválido', async () => {
          await request(app.getHttpServer())
            .post('/client/registrar')
            .set('Authorization', 'Bearer token-invalido')
            .expect(HttpStatus.UNAUTHORIZED);
        });

        it('Debe rechazar un DTO con datos inválidos', async () => {
          await request(app.getHttpServer())
            .post('/client/registrar')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              nombre: 'AB',
              mailContacto: 'correo-invalido',
              plan: 'PLAN_INEXISTENTE',
            })
            .expect(HttpStatus.BAD_REQUEST);
        });

        it('Debe rechazar el registro si el usuario no es superadministrador', async () => {
          const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .set('X-API-Key', testApiKey)
            .send({
              email: usuarioPrueba.correo,
              password: usuarioPruebaPass,
            })
            .expect(HttpStatus.OK);

          await request(app.getHttpServer())
            .post('/client/registrar')
            .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
            .send({
              nombre: 'Empresa No Autorizada',
              mailContacto: 'contacto@noautorizada.com',
              plan: PlanesSuscripcion.BRONCE,
            })
            .expect(HttpStatus.FORBIDDEN);
        });
      });
    });

    describe('Flujo de consulta de clientes', () => {
      describe('/client/all (GET)', () => {
        it('debe devolver la lista de clientes a un superadministrador', async () => {
          const response = await request(app.getHttpServer())
            .get('/client/all')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(HttpStatus.OK)

          expect(response.body).toBeDefined();
          expect(response.body).toHaveLength(2);
        });

        it('debe rechazar la solicitud si no se proporciona un token', async () => {
          return request(app.getHttpServer())
            .get('/client/all')
            .expect(HttpStatus.UNAUTHORIZED);
        });

        it('debe rechazar un token inválido', async () => {
          return request(app.getHttpServer())
            .get('/client/all')
            .set('Authorization', 'Bearer token-invalido')
            .expect(HttpStatus.UNAUTHORIZED);
        });

        it('Debe rechazar el registro si el usuario no es superadministrador', async () => {
          const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .set('X-API-Key', testApiKey)
            .send({
              email: usuarioPrueba.correo,
              password: usuarioPruebaPass,
            })
            .expect(HttpStatus.OK);

          await request(app.getHttpServer())
            .get('/client/all')
            .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
            .expect(HttpStatus.FORBIDDEN);
        });
      })
    })
  });

  describe('OperationModule', () => {
    describe('GET /operations/:idUsuario', () => {
      it('debe devolver las operaciones del usuario', async () => {
        const response = await request(app.getHttpServer())
          .get(`/operations/${usuarioPrueba.idUsuario}`)
          .set('X-API-Key', testApiKey)
          .expect(200);

        expect(response.body).toBeDefined();
      });

      it('debe rechazar la solicitud si falta la API Key', async () => {
        await request(app.getHttpServer())
          .get(`/operations/${usuarioPrueba.idUsuario}`)
          .expect(401);
      });

      it('debe rechazar una API Key inválida', async () => {
        await request(app.getHttpServer())
          .get(`/operations/${usuarioPrueba.idUsuario}`)
          .set('X-API-Key', 'api-key-invalida')
          .expect(401);
      });
    });
  });
});
