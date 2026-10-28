### Descripción

El **Microservicio de Gestión de Usuarios** es una solución basada en NestJS diseñada para manejar de manera eficiente la administración de usuarios en aplicaciones web. Este microservicio abarca funcionalidades clave como el registro de usuarios, autenticación mediante JWT, recuperación de contraseñas, y la validación de tokens, asegurando que solo usuarios autorizados puedan acceder a los recursos de la aplicación. 

El servicio está optimizado para despliegue en entornos cloud, utilizando contenedores Docker y Kubernetes, y se integra fácilmente en pipelines de CI/CD para un flujo de trabajo ágil y automatizado. 

Este proyecto no solo busca cumplir con los requisitos de seguridad y eficiencia, sino también implementar las mejores prácticas en desarrollo y operaciones (DevOps) para asegurar su escalabilidad y mantenibilidad en entornos de producción.

### Tabla de Contenidos

1. [Descripción](#descripción)
2. [Tabla de Contenidos](#tabla-de-contenidos)
3. [Explicación del Proyecto](#explicación-del-proyecto)
   - [Motivación](#motivación)
   - [Uso de npm y DevOps](#uso-de-npm-y-devops)
   - [GitHub Actions](#github-actions)
4. [Instalación y Requerimientos](#instalación-y-requerimientos)
   - [Variables de Entorno](#variables-de-entorno)
   - [Instalación](#instalación)
5. [Uso](#uso)
   - [Instalación desde npm](#instalación-desde-npm)
   - [Ejemplo de Uso](#ejemplo-de-uso)
   - [Comandos Disponibles](#comandos-disponibles)
   - [Endpoints Disponibles](#endpoints-disponibles)
      - [Modulo de autenticacion](#Módulo-de-Autenticación)
      - [Módulo de Gestión de Usuarios](#Módulo-de-Gestión-de-Usuarios)
      - [Módulo de Gestión de Roles](#Módulo-de-Gestión-de-Roles)
      - [Módulo de Gestión de Auditoría y Operaciones](#módulo-de-gestión-de-auditoría-y-operaciones)
6. [Datos de prueba para la API](#datos-de-prueba-para-la-api)
7. [Despliegue](#despliegue)
   - [Despliegue en Producción](#despliegue-en-producción)
   - [Despliegue en la nube](#despliegue-en-la-nube)
8. [Documentación](#documentación)
9. [Contribución](#contribución)
10. [Licencia](#licencia)

### Explicación del Proyecto

#### Motivación
El microservicio de gestión de usuarios se desarrolló para proporcionar un sistema confiable y seguro que pueda integrarse fácilmente en aplicaciones web modernas. La administración de usuarios es fundamental para la seguridad y la experiencia del usuario, y este proyecto busca implementar estas funcionalidades utilizando tecnologías avanzadas como NestJS, Docker, y Kubernetes.

#### Uso de npm y DevOps
Este microservicio está disponible como un paquete npm, lo que facilita su integración y despliegue en diferentes entornos. Además, se han implementado prácticas de DevOps, como pipelines de CI/CD con GitHub Actions, para asegurar un flujo de trabajo automatizado, eficiente y libre de errores.

#### GitHub Actions
Se utiliza GitHub Actions para automatizar el proceso de pruebas, construcción y despliegue del microservicio. Esto garantiza que cada cambio en el código pase por un proceso riguroso de validación antes de ser desplegado en producción, asegurando la calidad y estabilidad del servicio.

### Instalación y Requerimientos

#### Requerimientos
Para ejecutar este microservicio, se necesitan los siguientes componentes:

- **Node.js** v14 o superior
- **npm** v6 o superior
- **Docker** para la contenedorización
- **Kubernetes** (compatible con GKE o AWS)

#### Variables de Entorno
Asegúrate de configurar las siguientes variables de entorno para el correcto funcionamiento del microservicio:

- `JWT_SECRET`: Secreto para la generación de tokens JWT.
- `HASH_SALT_ROUNDS`: Número de rondas para hashing de contraseñas.
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`: Configuraciones para la base de datos.
- `PORT`: Puerto de la aplicacion
- `NGINX_HOST`, `NGINX_HOST`: Configuracion NGINX
- `REDIS_HOST`, `REDIS_PORT`: Configuracion REDIS

### Instalación y Requerimientos

#### Requerimientos
Para ejecutar este microservicio, asegúrate de contar con los siguientes componentes:

- **Node.js** v14 o superior
- **npm** v6 o superior
- **Docker** para contenedores
- **Kubernetes** (compatible con GKE o AWS)

#### Variables de Entorno
Configura las siguientes variables de entorno:

- `JWT_SECRET`: Secreto para JWT.
- `HASH_SALT_ROUNDS`: Rondas de hashing.
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`: Configuración de base de datos.
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`: Configuración de correo.
- `FRONTEND_URL`: URL del frontend.

#### Instalación
1. Clonar el repositorio:
    ```bash
    git clone https://github.com/tu-usuario/microservicio-usuarios.git
    cd microservicio-usuarios
    ```

2. Instalar las dependencias:
    ```bash
    npm install
    ```

3. Configurar las variables de entorno (ver sección Variables de Entorno).

Esta sección te guía a través de los pasos necesarios para clonar el repositorio, instalar las dependencias, y configurar el entorno antes de usar el microservicio.

### Uso

#### Instalación desde npm
Instala el microservicio directamente desde npm:

```bash
npm install micro-users-service
```

#### Ejemplo de Uso
Ejemplo básico de uso:

```javascript
const UserService = require('micro-users-service');

const userService = new UserService();
userService.registerUser({ name: 'John Doe', email: 'john.doe@example.com' });
```

#### Comandos Disponibles
- `npm run start`: Inicia el servidor en modo producción.
- `npm run start:dev`: Inicia el servidor en modo desarrollo con recarga en caliente.
- `npm run start:debug`: Inicia el servidor en modo depuración.
- `npm run start:prod`: Inicia el servidor utilizando el código compilado en `dist`.
- `npm run build`: Compila el proyecto TypeScript a JavaScript.
- `npm run test`: Ejecuta pruebas unitarias con Jest.
- `npm run test:watch`: Ejecuta pruebas unitarias en modo observación.
- `npm run test:cov`: Ejecuta pruebas unitarias y genera un reporte de cobertura de código.
- `npm run test:debug`: Ejecuta pruebas unitarias en modo depuración.
- `npm run test:e2e`: Ejecuta pruebas de extremo a extremo (e2e).
- `npm run lint`: Ejecuta ESLint para encontrar problemas en el código.
- `npm run format`: Formatea el código utilizando Prettier.


#### Endpoints Disponibles

## Módulo de Autenticación

Controlador encargado de la gestión de credenciales, ciclo de vida de sesiones (emisión y revocación de JWT), validación de tokens y el flujo seguro para la recuperación y cambio de contraseñas.

---

### 1. Iniciar Sesión (Login)

* **Método y Ruta:** `POST /auth/login`
* **Descripción:** Autentica a un usuario validando sus credenciales y genera un par de tokens (`accessToken` y `refreshToken`).
* **Acceso / Autenticación:** Público.
* **Cuerpo de la Petición (`Request Body`):** `CredentialsDTO`
  ```json
  {
    "email": "juan.perez@example.com",
    "password": "miPasswordSeguro123"
  }

  ```
* **Respuestas Esperadas:**
* **200 OK:** Login exitoso y tokens generados.
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }

  ```
* **401 Unauthorized:** Credenciales inválidas o usuario no verificado/bloqueado.
  ```json
  {
    "statusCode": 401,
    "message": "Invalid email or password"
  }

  ```
---
### 2. Cerrar Sesión (Logout)
* **Método y Ruta:** `POST /auth/logout`
* **Descripción:** Invalida el `refreshToken` enviado y finaliza la sesión activa del usuario en la base de datos.
* **Acceso / Autenticación:** Privado (Basado en `refreshToken`).
* **Cuerpo de la Petición (`Request Body`):** `LogoutDTO`
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }

  ```
* **Respuestas Esperadas:**
* **200 OK:** Sesión cerrada correctamente.
  ```json
  {
    "message": "Logout successful"
  }

  ```
* **401 Unauthorized:** Refresh Token inválido, expirado o sesión no existente/inactiva.
  ```json
  {
    "statusCode": 401,
    "message": "Refresh Token inválido o sesión no válida"
  }

  ```

---

### 3. Verificar Token (Check Auth)

* **Método y Ruta:** `POST /auth/checkAuth`
* **Descripción:** Decodifica y verifica la validez y el contenido (*payload*) de un `accessToken`.
* **Acceso / Autenticación:** Público / Utilitario.
* **Cuerpo de la Petición (`Request Body`):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }

  ```
* **Respuestas Esperadas:**
* **200 OK / 201 Created:** Token verificado y decodificado correctamente.
  ```json
  {
    "decoded": {
      "userId": "492272b4-7cb7-11f1-80d5-0242ac130002",
      "idCliente": "043ef9f3-7cb7-11f1-80d5-0242ac130002",
      "tipo": "SUPER_ADMINISTRADOR",
      "sesionId": "ad5379d8-7fb7-4e73-86e4-dcc7b7e0fa71",
      "roles": ["ADMIN"]
    }
  }

  ```
* **401 Unauthorized:** Token inválido o expirado.
  ```json
  {
    "statusCode": 401,
    "message": "Invalid or expired token"
  }

  ```

---

### 4. Renovar Token de Acceso (Refresh Token)

* **Método y Ruta:** `POST /auth/refresh`
* **Descripción:** Emite un nuevo `accessToken` válido utilizando un `refreshToken` activo y no expirado.
* **Acceso / Autenticación:** Privado (Basado en `refreshToken`).
* **Cuerpo de la Petición (`Request Body`):**
    ```json
    {
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    }

    ```
* **Respuestas Esperadas:**
* **200 OK:** Nuevo token de acceso generado exitosamente.
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }

  ```
* **401 Unauthorized:** Refresh token inválido, revocado o expirado.
  ```json
  {
    "statusCode": 401,
    "message": "Invalid or expired refresh token"
  }

  ```

---

### 5. Solicitar Recuperación de Contraseña

* **Método y Ruta:** `PATCH /auth/solitarRecuperacion`
* **Descripción:** Inicia el proceso de recuperación de clave para un usuario de una organización cliente y genera un token temporal de recuperación.
* **Acceso / Autenticación:** M2M (`ApiKeyGuard`).
* **Cabeceras Requeridas (`Headers`):**
* `X-API-Key`: Clave secreta M2M del cliente/organización.
* **Cuerpo de la Petición (`Request Body`):** `RecuperarContraseñaSolicitudDTO`
  ```json
  {
    "correo": "usuario@cliente.com"
  }

  ```
* **Respuestas Esperadas:**
* **200 OK:** Solicitud procesada y token de recuperación generado.
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }

  ```
* **400 Bad Request:** El usuario no pertenece al cliente especificado.
* **404 Not Found:** No existe un usuario con el correo proporcionado.
* **409 Conflict:** El usuario se encuentra en un estado inconsistente.

---

### 6. Validar Token de Cambio de Contraseña

* **Método y Ruta:** `POST /auth/validarCambioPass`
* **Descripción:** Valida la integridad y vigencia de un token de recuperación de contraseña en el canal M2M.
* **Acceso / Autenticación:** M2M + Recovery Token (`ApiKeyGuard`, `RecuperarPassGuard`).
* **Cabeceras Requeridas (`Headers`):**
* `X-API-Key`: Clave secreta M2M del cliente/organización.
* `X-Token-Recover`: Token temporal emitido para la recuperación de contraseña.
* **Respuestas Esperadas:**
* **200 OK:** Token válido.
  ```json
  {
    "message": "Token válido"
  }

  ```
* **401 Unauthorized:** API Key o Token de recuperación inválido / expirado.

---

### 7. Confirmar Cambio de Contraseña

* **Método y Ruta:** `PATCH /auth/confirmarRecuperacion`
* **Descripción:** Actualiza la contraseña del usuario identificado tras validar el token de recuperación y la nueva credencial.
* **Acceso / Autenticación:** M2M + Recovery Token (`ApiKeyGuard`, `RecuperarPassGuard`).
* **Cabeceras Requeridas (`Headers`):**
* `X-API-Key`: Clave secreta M2M del cliente/organización.
* `X-Token-Recover`: Token temporal emitido para la recuperación.
* **Cuerpo de la Petición (`Request Body`):** `CambiarContraseñaDTO`
  ```json
  {
    "contraseña": "NuevaPasswordSegura2026!"
  }

  ```
* **Respuestas Esperadas:**
* **200 OK:** Contraseña actualizada exitosamente.
  ```json
  {
    "message": "Contraseña cambiada exitosamente"
  }

  ```
* **401 Unauthorized:** Token de recuperación inválido o expirado.
* **404 Not Found:** Usuario no encontrado.
* **409 Conflict:** Usuario no verificado.

## Módulo de Gestión de Usuarios

Controlador encargado de la administración de identidades, asignación/remoción de roles corporativos, verificación de estados, altas/bajas lógicas y consultas paginadas con aislamiento multi-inquilino (*Tenant Isolation*).

---

### 1. Registrar Usuario (M2M)

- **Método y Ruta:** `POST /users/registrar-usuario`
- **Descripción:** Permite a un sistema externo integrado aprovisionar usuarios en su organización utilizando su API Key corporativa.
- **Acceso / Autenticación:** M2M (`ApiKeyGuard`).
- **Cabeceras Requeridas (`Headers`):**
  - `X-API-Key`: Clave secreta M2M de la organización cliente.
- **Cuerpo de la Petición (`Request Body`):** `CreateUsuarioDTO`
  ```json
  {
    "correo": "usuario.nuevo@empresa.com",
    "contraseña": "PasswordSegura123!",
    "parametros": {
      "departamento": "TI",
      "cargo": "Desarrollador"
    },
    "roles": ["ROL_UUID_01", "ROL_UUID_02"]
  }

  ```
* **Respuestas Esperadas:**
* **201 Created:** Usuario registrado correctamente. Retorna la entidad creada.
* **400 Bad Request:** Los roles enviados no pertenecen a la organización cliente.
* **404 Not Found:** Cliente no encontrado.
* **409 Conflict:** El correo electrónico ya se encuentra registrado.

---

### 2. Verificar Usuario

* **Método y Ruta:** `PATCH /users/:idUsuario/verify`
* **Descripción:** Cambia el estado del usuario a verificado y activo en la organización, registrando la auditoría de forma transaccional.
* **Acceso / Autenticación:** M2M (`ApiKeyGuard`).
* **Cabeceras Requeridas (`Headers`):**
* `X-API-Key`: Clave secreta M2M de la organización cliente.
* **Parámetros de Ruta (`URL Params`):**
* `idUsuario`: ID o UUID del usuario a verificar.
* **Respuestas Esperadas:**
* **200 OK:** Usuario verificado exitosamente.
  ```json
  {
    "message": "Usuario verificado"
  }

  ```
* **400 Bad Request:** El usuario no pertenece al cliente especificado.
* **404 Not Found:** Cliente o Usuario no encontrado.
* **409 Conflict:** El usuario ya se encuentra verificado.

---

### 3. Asignar Roles a Usuario

* **Método y Ruta:** `PATCH /users/:idUsuario/asign-roles`
* **Descripción:** Asigna una lista de roles corporativos a un usuario perteneciente a la organización del cliente.
* **Acceso / Autenticación:** M2M (`ApiKeyGuard`).
* **Cabeceras Requeridas (`Headers`):**
* `X-API-Key`: Clave secreta M2M de la organización cliente.
* **Parámetros de Ruta (`URL Params`):**
* `idUsuario`: ID o UUID del usuario.
* **Cuerpo de la Petición (`Request Body`):** `RolesDTO`
  ```json
  {
    "roles": ["ROL_UUID_01", "ROL_UUID_02"]
  }

  ```
* **Respuestas Esperadas:**
* **200 OK:** Roles asignados exitosamente.
* **400 Bad Request:** El usuario o los roles no pertenecen al cliente especificado.
* **404 Not Found:** Cliente o Usuario no encontrado.

---

### 4. Remover Roles de Usuario

* **Método y Ruta:** `PATCH /users/:idUsuario/remove-roles`
* **Descripción:** Remueve una lista de roles asignados a un usuario de la organización cliente.
* **Acceso / Autenticación:** M2M (`ApiKeyGuard`).
* **Cabeceras Requeridas (`Headers`):**
* `X-API-Key`: Clave secreta M2M de la organización cliente.
* **Parámetros de Ruta (`URL Params`):**
* `idUsuario`: ID o UUID del usuario.
* **Cuerpo de la Petición (`Request Body`):** `RolesDTO`
  ```json
  {
    "roles": ["ROL_UUID_01"]
  }

  ```
* **Respuestas Esperadas:**
* **200 OK:** Roles removidos exitosamente.
* **400 Bad Request:** El usuario no pertenece al cliente especificado.
* **404 Not Found:** Cliente o Usuario no encontrado.
* **500 Internal Server Error:** Error interno del servidor.

---

### 5. Obtener Lista Paginada de Usuarios del Cliente

* **Método y Ruta:** `GET /users/cliente`
* **Descripción:** Permite a un administrador o sistema integrado obtener la lista de usuarios registrados de su organización con filtros opcionales y paginación.
* **Acceso / Autenticación:** M2M (`ApiKeyGuard`).
* **Cabeceras Requeridas (`Headers`):**
* `X-API-Key`: Clave secreta M2M de la organización cliente.
* **Parámetros de Consulta (`Query Params`):**
* `page` (obligatorio, number): Número de página (ej. `1`).
* `limit` (obligatorio, number): Cantidad de elementos por página (ej. `10`).
* `mailParcial` (opcional, string): Búsqueda parcial por correo (ej. `ejemplo`).
* `mail` (opcional, string): Búsqueda por correo exacto (ej. `ejemplo@gmail.com`).
* `verified` (opcional, boolean): Filtrar por estado de verificación (`true`/`false`).
* `estado` (opcional, enum): Estado de la entidad (`A` para Alta / `B` para Baja).
* **Respuestas Esperadas:**
* **200 OK:** Lista paginada de usuarios obtenida con éxito.
* **404 Not Found:** Cliente no encontrado.
* **500 Internal Server Error:** Error interno del servidor.

---

### 6. Dar de Baja Usuario

* **Método y Ruta:** `PATCH /users/:idUsuario/baja`
* **Descripción:** Ejecuta la baja lógica de un usuario perteneciente a la organización del cliente registrando el motivo.
* **Acceso / Autenticación:** M2M (`ApiKeyGuard`).
* **Cabeceras Requeridas (`Headers`):**
* `X-API-Key`: Clave secreta M2M de la organización cliente.
* **Parámetros de Ruta (`URL Params`):**
* `idUsuario`: ID o UUID del usuario.
* **Cuerpo de la Petición (`Request Body`):** `BajaAltaDTO`
  ```json
  {
    "motivo": "Inactivación por cese laboral"
  }

  ```
* **Respuestas Esperadas:**
* **200 OK:** Usuario dado de baja exitosamente.
* **400 Bad Request:** El usuario no pertenece al cliente especificado.
* **404 Not Found:** Usuario no encontrado.
* **409 Conflict:** El usuario ya se encuentra dado de baja.

---

### 7. Reactivar / Dar de Alta Usuario

* **Método y Ruta:** `PATCH /users/:idUsuario/alta`
* **Descripción:** Reactiva a un usuario previamente dado de baja lógica dentro de la organización.
* **Acceso / Autenticación:** M2M (`ApiKeyGuard`).
* **Cabeceras Requeridas (`Headers`):**
* `X-API-Key`: Clave secreta M2M de la organización cliente.
* **Parámetros de Ruta (`URL Params`):**
* `idUsuario`: ID o UUID del usuario.
* **Cuerpo de la Petición (`Request Body`):** `BajaAltaDTO`
```json
{
  "motivo": "Reincorporación de personal"
}

```
* **Respuestas Esperadas:**
* **200 OK:** Usuario dado de alta exitosamente.
* **400 Bad Request:** El usuario no pertenece al cliente especificado.
* **404 Not Found:** Usuario no encontrado.
* **409 Conflict:** El usuario ya se encuentra dado de alta.

---

### 8. Obtener Usuario por ID

* **Método y Ruta:** `GET /users/:idUsuario`
* **Descripción:** Busca y retorna los datos detallados de un usuario específico garantizando el aislamiento por organización.
* **Acceso / Autenticación:** M2M (`ApiKeyGuard`).
* **Cabeceras Requeridas (`Headers`):**
* `X-API-Key`: Clave secreta M2M de la organización cliente.
* **Parámetros de Ruta (`URL Params`):**
* `idUsuario`: ID o UUID del usuario.
* **Respuestas Esperadas:**
* **200 OK:** Objeto `Usuario` encontrado.
* **404 Not Found:** Usuario no encontrado o no pertenece a la organización.

---

### 9. Actualizar Usuario

* **Método y Ruta:** `PATCH /users/update/:idUsuario`
* **Descripción:** Modifica los datos o parámetros de un usuario perteneciente a la organización cliente.
* **Acceso / Autenticación:** M2M (`ApiKeyGuard`).
* **Cabeceras Requeridas (`Headers`):**
* `X-API-Key`: Clave secreta M2M de la organización cliente.
* **Parámetros de Ruta (`URL Params`):**
* `idUsuario`: ID o UUID del usuario.
* **Cuerpo de la Petición (`Request Body`):** `ModifyUsuarioDTO`
  ```json
  {
    "correo": "correo.actualizado@empresa.com",
    "parametros": {
      "departamento": "Finanzas"
    }
  }

  ```
* **Respuestas Esperadas:**
* **200 OK:** Usuario actualizado correctamente.
* **400 Bad Request:** Datos enviados inválidos.
* **404 Not Found:** Usuario no encontrado.

## Módulo de Gestión de Roles

Controlador encargado de la definición, consulta y administración de la matriz de roles y permisos corporativos (*RBAC - Role Based Access Control*), garantizando el almacenamiento aislado por cada organización cliente (*Multi-tenant Isolation*). Incluye optimización de lectura mediante almacenamiento en memoria caché.

---

### 1. Obtener Roles de la Organización

- **Método y Ruta:** `GET /roles/get-roles`
- **Descripción:** Recupera la lista completa de roles asociados a la organización del cliente autenticado. Utiliza interceptores de caché (`CacheInterceptor` / TTL de 300.000 ms) para optimizar el rendimiento y reducir consultas redundantes a la base de datos relacional.
- **Acceso / Autenticación:** M2M (`ApiKeyGuard`).
- **Cabeceras Requeridas (`Headers`):**
  - `X-API-Key`: Clave secreta M2M de la organización cliente.
- **Respuestas Esperadas:**
  - **200 OK:** Arreglo con la lista de roles registrados.
    ```json
    [
      {
        "idRol": "rol-1234-uuid",
        "nombre": "ADMINISTRADOR",
        "descripcion": "Acceso total a la gestión del cliente",
        "estado": "A"
      },
      {
        "idRol": "rol-5678-uuid",
        "nombre": "OPERADOR",
        "descripcion": "Acceso limitado a operaciones de lectura",
        "estado": "A"
      }
    ]
    ```
  - **401 Unauthorized:** API Key no provista, inválida o revocada.
  - **500 Internal Server Error:** Error interno del servidor o al recuperar la información.

---

### 2. Registrar Nuevo Rol (M2M)
- **Método y Ruta:** `POST /roles/crear-rol`
- **Descripción:** Permite a una organización o sistema integrado añadir un nuevo rol corporativo a su estructura usando su API Key.
- **Acceso / Autenticación:** M2M (`ApiKeyGuard`).
- **Cabeceras Requeridas (`Headers`):**
  - `X-API-Key`: Clave secreta M2M de la organización cliente.
- **Cuerpo de la Petición (`Request Body`):** `CreateRolDTO`
  ```json
  {
    "nombre": "SUPERVISOR",
    "descripcion": "Rol con permisos para supervisión y auditoría de operaciones"
  }

  ```
* **Respuestas Esperadas:**
* **201 Created:** Rol creado e integrado con éxito a la organización.
  ```json
  {
    "idRol": "rol-9999-uuid",
    "nombre": "SUPERVISOR",
    "descripcion": "Rol con permisos para supervisión y auditoría de operaciones",
    "estado": "A",
    "cliente": {
      "idCliente": "client-uuid-12345"
    }
  }

  ```
* **400 Bad Request:** Estructura o campos obligatorios del DTO inválidos.
* **401 Unauthorized:** API Key no provista, inválida o revocada.
* **500 Internal Server Error:** Error al procesar la creación o persistencia del rol.

## Módulo de Gestión de Auditoría y Operaciones

Controlador encargado de la consulta y trazabilidad de eventos de auditoría (*Audit Trail*) asociados a las actividades de los usuarios en la plataforma. Ofrece filtrado multicriterio, rangos de fechas e id del usuario con soporte para paginación y garantizando el aislamiento de datos por organización (*Tenant Isolation*).

---

### 1. Obtener Operaciones de un Usuario

- **Método y Ruta:** `GET /operations/:idUsuario`
- **Descripción:** Permite a una organización o sistema integrado consultar las operaciones y eventos de auditoría registrados para un usuario específico perteneciente a su tenant. Soporta paginación y filtros opcionales por tipo de operación y rangos temporales.
- **Acceso / Autenticación:** M2M (`ApiKeyGuard`).
- **Cabeceras Requeridas (`Headers`):**
  - `X-API-Key`: Clave secreta M2M de la organización cliente.
- **Parámetros de Ruta (`URL Params`):**
  - `idUsuario`: ID o UUID del usuario a consultar (ej. `User_01`).
- **Parámetros de Consulta (`Query Params`):**
  - `page` (opcional, number): Número de página (predeterminado: `1`).
  - `limit` (opcional, number): Cantidad de registros por página (mínimo: `10`, máximo: `100`, predeterminado: `10`).
  - `tipo` (opcional, enum): Tipo de operación para filtrar (ej. `REGISTRO_USUARIO`, `LOGIN`, `CAMBIO_PASS`, etc.).
  - `fechaRealizacion` (opcional, date/string): Fecha exacta de realización en formato ISO 8601 (ej. `2026-07-02T15:30:00.000Z`).
  - `despueDe` (opcional, date/string): Fecha de inicio para filtrado de rango desde ese momento en adelante (ej. `2026-07-01T00:00:00.000Z`).
  - `antesDe` (opcional, date/string): Fecha límite para filtrado de rango hasta ese momento (ej. `2026-07-31T23:59:59.999Z`).
- **Respuestas Esperadas:**
- **200 OK:** Objeto paginado con el listado de operaciones encontradas.
  ```json
    {
      "data": [
        {
          "idOperacion": "op-uuid-101",
          "tipo": "INICIO_SESION",
          "fechaRealizacion": "2026-07-02T15:30:00.000Z",
          "ipOrigen": "192.168.1.10",
          "detalles": "Inicio de sesión exitoso"
        }
      ],
      "meta": {
        "totalItems": 45,
        "itemsPerPage": 10,
        "currentPage": 1,
        "totalPages": 5
      }
    }
  ```
- **401 Unauthorized:** API Key no provista, inválida o expirada.
- **404 Not Found:** Cliente u Organización o Usuario no encontrado.
- **500 Internal Server Error:** Error interno del servidor al procesar la búsqueda.

## Datos de Prueba para la API

Para facilitar el proceso de evaluación, desarrollo y pruebas de integración local/remota de las distintas rutas expuestas por el microservicio, se proporcionan las siguientes credenciales y datos preconfigurados.

---

#### 1. Credenciales para la Integración M2M (Servidor a Servidor)

Las peticiones orientadas a la integración entre sistemas externos y el microservicio (como aprovisionamiento de usuarios, creación de roles y consulta de operaciones) operan sobre el canal **Machine-to-Machine (M2M)**. Este canal requiere autenticación mediante **API Key corporativa** a través del encabezado HTTP `X-API-Key`.

* **API Key de Prueba:**
  ```text
  sk_5e67ed57e78ff68e6c73710da524d66c749d4b9b7d622d468e027c763b4c55a2

```

* **Encabezado HTTP Requerido (`Header`):**
```http
X-API-Key: sk_5e67ed57e78ff68e6c73710da524d66c749d4b9b7d622d468e027c763b4c55a2

```

> **Nota de Seguridad:** La API Key provista corresponde al hash registrado para el cliente/organización de prueba en la base de datos de desarrollo/evaluación. El microservicio resuelve de forma automática el identificador de la organización (`idCliente` / `tenantId`) a partir del hash determinista SHA-256 de esta clave.

---

#### 2. Credenciales de Usuario de Prueba (Canal Interactivo)

Para las operaciones que requieren autenticación de usuario final o administrador de cliente (inicio de sesión, obtención de tokens JWT y renovación de sesión):

* **Correo Electrónico (`TEST_EMAIL`):** `usuario@empresa.com`
* **Contraseña (`TEST_PASSWORD`):** `usuario@empresa.com`

##### Ejemplo de Petición de Inicio de Sesión (`POST /auth/login`):

```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@empresa.com",
    "password": "usuario@empresa.com"
  }'

```

**Respuesta Esperada (`200 OK`):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}

```

---

#### 3. Ejemplo de Uso Combinado en Postman / cURL

#### Aprovisionamiento de Usuario vía API Key (M2M)

```bash
curl -X POST "http://localhost:3000/users/registrar-usuario" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_5e67ed57e78ff68e6c73710da524d66c749d4b9b7d622d468e027c763b4c55a2" \
  -d '{
    "correo": "nuevo.empleado@empresa.com",
    "contraseña": "PasswordSegura123!",
    "roles": []
  }'

```

### Despliegue

#### Despliegue en Producción

Para desplegar el entorno completo de producción o pruebas locales con **Docker Compose**, balanceo de carga mediante **Nginx**, persistencia en **MySQL** y soporte de caché distribuida en memoria con **Redis**, sigue los pasos estructurados a continuación[cite: 2, 3].

##### 1. Estructura de Configuración de Nginx (`nginx/default.conf.template`)

Crea la plantilla de configuración en `./nginx/default.conf.template` para procesar dinámicamente las variables de entorno al iniciar el contenedor proxy[cite: 2]:

```nginx
server {
    listen \${NGINX_PORT};
    charset utf-8;
    access_log off;

    server_name \${NGINX_HOST};

    location / {
        # Redirección de peticiones hacia el clúster de NestJS
        proxy_pass http://${SERVER_HOST}:${PORT};

        # Encabezados HTTP para proxy inverso y WebSockets
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Tiempos de espera y reconexión
        proxy_connect_timeout 10s;
        proxy_read_timeout 60s;
    }
}

```

##### 2. Dockerfile para Nginx (`nginx/Dockerfile`)

Crea el archivo `./nginx/Dockerfile` para construir el contenedor del proxy/balanceador:

```dockerfile
FROM nginx:1.18.0-alpine
WORKDIR /etc/nginx/templates
COPY default.conf.template /etc/nginx/templates/default.conf.template

```

##### 3. Archivo de Orquestación (`docker-compose.yml`)

El archivo `docker-compose.yml` en la raíz del proyecto integra la API de NestJS, Nginx, MySQL, Redis y phpMyAdmin bajo una red puente común (`app-network`):

```yaml
services:
  # Servicio de la API (NestJS)
  app:
    build:
      context: .
      dockerfile: Dockerfile
    env_file:
      - .env
    environment:
      JWT_SECRET: \${JWT_SECRET}
      HASH_SALT_ROUNDS: \${HASH_SALT_ROUNDS}
      REFRESH_TOKEN_SECRET: \${REFRESH_TOKEN_SECRET}
      DB_HOST: mysql-api
      DB_PORT: 3306
      DB_USERNAME: \${DB_USERNAME}
      DB_PASSWORD: \${DB_PASSWORD}
      DB_DATABASE: \${DB_DATABASE}
      PORT: \${PORT}
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - mysql-api
      - redis
    networks:
      - app-network

  # Balanceador de Carga / Proxy Inverso (Nginx)
  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    container_name: \${NGINX_HOST}
    restart: always
    env_file:
      - .env
    ports:
      - "${NGINX_PORT}:${NGINX_PORT}"
    depends_on:
      - app
    networks:
      - app-network

  # Base de Datos MySQL
  mysql-api:
    image: mysql:8.0
    container_name: mysql-api
    restart: always
    ports:
      - '3307:3306'
    env_file:
      - .env
    environment:
      MYSQL_ROOT_PASSWORD: \${DB_PASSWORD}
      MYSQL_DATABASE: \${DB_DATABASE}
      MYSQL_USER: \${DB_USERNAME}
      MYSQL_PASSWORD: \${DB_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - app-network

  # Servicio de Caché Redis
  redis:
    image: redis:alpine
    container_name: redis_cache
    restart: always
    ports:
      - "6379:6379"
    networks:
      - app-network

  # Gestor de Base de Datos phpMyAdmin
  phpmyadmin:
    image: phpmyadmin:latest
    container_name: phpmyadmin-api
    restart: always
    ports:
      - '8080:80'
    environment:
      PMA_HOST: mysql-api
      PMA_PORT: 3306
      MYSQL_ROOT_PASSWORD: \${DB_PASSWORD}
    depends_on:
      - mysql-api
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mysql-data:

```

##### 4. Comandos de Despliegue, Escalado y Verificación

1. **Construir las imágenes del proyecto:**
```bash
docker compose build

```


2. **Iniciar el clúster con balanceo de carga (ejemplo con 3 réplicas de la API):**
```bash
docker compose up -d --scale app=3

```


3. **Verificar el estado de los contenedores activos:**
```bash
docker compose ps

```


4. **Monitorear la distribución Round-Robin del balanceador en los logs:**
```bash
docker compose logs -f app
```

#### Despliegue en la Nube

Para garantizar un entorno de producción altamente disponible, escalable y automatizado, el microservicio está preparado para desplegarse de manera continua (*Continuous Deployment*) en **Oracle Cloud Infrastructure (OCI)**[cite: 1]. 

Aprovechando la capacidad de cómputo de la arquitectura ARM64 (Ampere Altra) asignada a la máquina virtual (`VM.Standard.A1.Flex` con 2 OCPUs y 12 GB de RAM)[cite: 1], el flujo de despliegue ejecuta la compilación nativa de los contenedores y distribuye la carga entre las réplicas de la API[cite: 1].

---

##### 1. Arquitectura de Despliegue en OCI

```text
               [ Peticiones de Internet ]
                           │
                           ▼
             ┌───────────────────────────┐
             │    Oracle Cloud (OCI)     │ (Ingress Security List / Firewall: Ports 80, 443)
             └─────────────┬─────────────┘
                           │
                           ▼
             ┌───────────────────────────┐
             │ Nginx (Proxy / Load Bal.) │ (Puerto 80)
             └─────────────┬─────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
  ┌─────────────────────┐     ┌─────────────────────┐
  │ NestJS API (App 1)  │     │ NestJS API (App 2)  │ (Escalado ARM en 2 OCPUs)
  └──────────┬──────────┘     └──────────┬──────────┘
             │                           │
             └─────────────┬─────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
  ┌─────────────────────┐     ┌─────────────────────┐
  │   MySQL 8.0 (DB)    │     │    Redis (Cache)    │ (Volúmenes Persistentes)
  └─────────────────────┘     └─────────────────────┘

```

* **Proxy Inverso / Balanceador de Carga:** Nginx recibe el tráfico de red en el puerto 80 y lo distribuye mediante el algoritmo *Round-Robin* entre las réplicas activas de NestJS.


* **Escalabilidad Multihilo:** Al correr 2 réplicas de la API (`--scale app=2`), se aprovecha al máximo el paralelismo de los 2 núcleos dedicados de la CPU ARM.


* **Persistencia de Datos:** Los volúmenes montados en la VM garantizan que `docker compose down` detenga los contenedores sin alterar los datos transaccionales almacenados en MySQL.

---

##### 2. Configuración de Credenciales en GitHub Secrets

Para mantener la seguridad del servidor y los entornos de producción sin exponer credenciales en el repositorio, se deben registrar los siguientes secretos en **GitHub** (`Settings -> Secrets and variables -> Actions`):

| Nombre de la Secret | Descripción / Asignación |
| --- | --- |
| `OCI_HOST` | Dirección IP pública de la instancia de Oracle Cloud. |
| `OCI_USERNAME` | Usuario SSH con acceso a la máquina virtual (`ubuntu` u `opc`). |
| `OCI_SSH_KEY` | Clave privada SSH de acceso al servidor. |
| `OCI_PORT` | Puerto de conexión SSH (`22`). |
| `DB_USERNAME` | Usuario administrador/aplicación para MySQL. |
| `DB_PASSWORD` | Contraseña segura para la base de datos MySQL. |
| `DB_DATABASE` | Nombre de la base de datos relacional. |
| `JWT_SECRET` | Clave secreta para la firma de tokens JWT. |
| `REFRESH_TOKEN_SECRET` | Clave secreta para la generación de tokens de refresco. |
| `HASH_SALT_ROUNDS` | Número de rondas para el hashing con bcrypt. |

---

##### 3. Workflow de Integración y Despliegue Continuo (CI/CD)

El archivo `.github/workflows/deploy.yml` automatiza la suite de pruebas unitarias/integración, la compilación de TypeScript y la ejecución remota vía SSH en Oracle Cloud:

```yaml
name: CD Pipeline - Continuous Deployment to OCI

on:
  push:
    branches:
      - master
      - main
  workflow_dispatch: # Permite ejecuciones manuales desde la pestaña Actions

jobs:
  deploy:
    name: Deploy to Oracle Cloud Infrastructure (ARM)
    runs-on: ubuntu-latest

    # Variables globales inyectadas para la ejecución de pruebas unitarias
    env:
      JWT_SECRET: \${{ secrets.JWT_SECRET }}
      REFRESH_TOKEN_SECRET: \${{ secrets.REFRESH_TOKEN_SECRET }}
      HASH_SALT_ROUNDS: \${{ secrets.HASH_SALT_ROUNDS }}
      DB_USERNAME: \${{ secrets.DB_USERNAME }}
      DB_PASSWORD: \${{ secrets.DB_PASSWORD }}
      DB_DATABASE: \${{ secrets.DB_DATABASE }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run Unit & Integration tests
        run: npm run test -- --runInBand

      - name: Build Application
        run: npm run build

      - name: Deploying to OCI via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: \${{ secrets.OCI_HOST }}
          username: \${{ secrets.OCI_USERNAME }}
          key: \${{ secrets.OCI_SSH_KEY }}
          port: \${{ secrets.OCI_PORT }}
          script: |
            # 1. Navegar al directorio del proyecto en la máquina virtual
            cd ~/Mi-Tesis-Microservicio || exit 1

            # 2. Inyectar dinámicamente el archivo .env desde GitHub Secrets
            cat << 'EOF' > .env
            NGINX_PORT=80
            NGINX_HOST=nginx
            SERVER_HOST=app
            PORT=3000
            DB_HOST=mysql-api
            DB_PORT=3306
            DB_USERNAME=\${{ secrets.DB_USERNAME }}
            DB_PASSWORD=\${{ secrets.DB_PASSWORD }}
            DB_DATABASE=\${{ secrets.DB_DATABASE }}
            REDIS_HOST=redis
            REDIS_PORT=6379
            JWT_SECRET=\${{ secrets.JWT_SECRET }}
            REFRESH_TOKEN_SECRET=\${{ secrets.REFRESH_TOKEN_SECRET }}
            HASH_SALT_ROUNDS=\${{ secrets.HASH_SALT_ROUNDS }}
            FRONTEND_URL=http://\${{ secrets.OCI_HOST }}
            EOF

            # 3. Descargar los últimos cambios del repositorio
            git pull origin master

            # 4. Reconstruir y desplegar el clúster escalado a 2 réplicas ARM
            docker compose down
            docker compose up -d --build --scale app=2

            # 5. Limpieza de imágenes e instancias inactivas para optimizar almacenamiento
            docker system prune -f

```

---

##### 4. Requisitos Previos en la Instancia de Oracle Cloud

Para asegurar que la primera ejecución automatizada del pipeline se complete con éxito, la máquina virtual en OCI debe configurarse previamente con las siguientes reglas:

1. **Apertura de Puertos en OCI (Security List):**
* En la consola web de Oracle Cloud, ingresar a `Networking -> Virtual Cloud Networks -> Security List` y agregar una regla de ingreso (*Ingress Rule*) para habilitar el tráfico de los puertos `80` (HTTP) y `443` (HTTPS) desde la CIDR `0.0.0.0/0`.


2. **Configuración de Firewall de Linux (`iptables`/`ufw`):**
```bash
sudo ufw allow 80/tcp
sudo ufw reload

```


3. **Asignación de Permisos de Docker al Usuario:**
```bash
sudo usermod -aG docker \$USER

```


4. **Clonación Inicial del Repositorio:**
```bash
cd ~
git clone [https://github.com/GermanSan2002/Mi-Tesis-Microservicio.git](https://github.com/GermanSan2002/Mi-Tesis-Microservicio.git)

```
### Documentación

#### GitHub Actions
El proyecto está configurado con GitHub Actions para implementar CI/CD, automatizando el proceso de pruebas, compilación, y despliegue. Los flujos de trabajo se encuentran en el directorio `.github/workflows/` y están diseñados para:

- Ejecutar pruebas unitarias con cada push al repositorio.
- Construir y publicar imágenes Docker en un registro (como GCR o ECR).
- Desplegar automáticamente el microservicio en un clúster de Kubernetes.

#### Swagger
Para facilitar la exploración y prueba de la API, se ha integrado Swagger en el proyecto. Swagger genera automáticamente la documentación interactiva de la API, permitiendo a los desarrolladores probar los endpoints directamente desde el navegador. Puedes acceder a la documentación de Swagger en `/api/docs` una vez que el servidor esté en ejecución.

### Contribución

¡Contribuciones son bienvenidas! Por favor, sigue estos pasos para contribuir:

1. Haz un fork del repositorio.
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commits (`git commit -am 'Añadir nueva funcionalidad'`).
4. Sube tus cambios (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

Asegúrate de que tu código sigue las normas de estilo del proyecto y pasa todas las pruebas.

### Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.