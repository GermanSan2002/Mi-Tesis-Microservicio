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
6. [Despliegue](#despliegue)
   - [Despliegue en Producción](#despliegue-en-producción)
   - [Despliegue con Kubernetes en Google Cloud](#despliegue-con-kubernetes-en-google-cloud)
   - [Despliegue en Render](#despliegue-en-render)
   - [Despliegue con Kubernetes en AWS](#despliegue-con-kubernetes-en-aws)
   - [Enlaces de Despliegue](#enlaces-de-despliegue)
7. [Documentación](#documentación)
8. [Contribución](#contribución)
9. [Licencia](#licencia)
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
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`: Configuraciones para el servicio de correo.
- `FRONTEND_URL`: URL del frontend asociado.

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
1. **Login**
   - URL: `/auth/login`
   - Método: `POST`
   - Descripción: Autentica un usuario y devuelve un token.
   - Cuerpo de la Solicitud:
     ```json
     {
       "email": "usuario@ejemplo.com",
       "password": "tu_contraseña"
     }
     ```
   - Cuerpo de la Respuesta:
     ```json
     {
      "accessToken": "newAccessToken"
      "refreshToken": "newAccessToken"
     }
     ```
