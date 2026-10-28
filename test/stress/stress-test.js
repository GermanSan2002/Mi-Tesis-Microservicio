import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métricas independientes por endpoint.
const rolesDuration = new Trend('roles_duration', true);
const loginDuration = new Trend('login_duration', true);

const rolesErrors = new Rate('roles_errors');
const loginErrors = new Rate('login_errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 0 }
  ],
  thresholds: {
    // Criterios generales.
    http_req_failed: ['rate<0.01'],

    // Latencia independiente de cada endpoint.
    roles_duration: ['p(95)<200'],
    login_duration: ['p(95)<500'],

    // Menos del 1 % de errores funcionales por endpoint.
    roles_errors: ['rate<0.01'],
    login_errors: ['rate<0.01'],
  },

  // Evita que las solicitudes a localhost usen el proxy
  // configurado en el entorno de la máquina.
  noConnectionReuse: false,
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9000';
const API_KEY = "sk_5e67ed57e78ff68e6c73710da524d66c749d4b9b7d622d468e027c763b4c55a2";
const TEST_EMAIL = "usuario@empresa.com";
const TEST_PASSWORD = "usuario@empresa.com";

if (!API_KEY || !TEST_EMAIL || !TEST_PASSWORD) {
  throw new Error(
    'Debes configurar TEST_API_KEY, TEST_EMAIL y TEST_PASSWORD.'
  );
}

const commonParams = {
  timeout: '30s',
  tags: { service: 'nest-api' },
};

export default function () {
  // Escenario 1: consulta protegida de roles.
  const resRoles = http.get(`${BASE_URL}/roles/get-roles`, {
    ...commonParams,
    headers: {
      Accept: 'application/json',
      'X-API-KEY': API_KEY,
    },
    tags: { endpoint: 'get-roles', scenario: 'roles' },
  });

  rolesDuration.add(resRoles.timings.duration);

  const rolesOk = check(resRoles, {
    'Roles: HTTP 200': (r) => r.status === 200,
    'Roles: respuesta JSON válida': (r) => {
      try {
        return Array.isArray(r.json());
      } catch (_) {
        return false;
      }
    },
    'Roles: latencia inferior a 200 ms': (r) =>
      r.timings.duration < 200,
  });

  rolesErrors.add(!rolesOk);

  sleep(0.5);

  // Escenario 2: inicio de sesión.
  const payload = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  const resLogin = http.post(`${BASE_URL}/auth/login`, payload, {
    ...commonParams,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-KEY': API_KEY,
    },
    tags: { endpoint: 'login', scenario: 'auth' },
  });

  loginDuration.add(resLogin.timings.duration);

  const loginOk = check(resLogin, {
    'Login: HTTP 200 o 201': (r) =>
      r.status === 200 || r.status === 201,

    'Login: devuelve accessToken': (r) => {
      try {
        return typeof r.json('accessToken') === 'string'
          && r.json('accessToken').length > 0;
      } catch (_) {
        return false;
      }
    },

    'Login: devuelve refreshToken': (r) => {
      try {
        return typeof r.json('refreshToken') === 'string'
          && r.json('refreshToken').length > 0;
      } catch (_) {
        return false;
      }
    },
  });

  loginErrors.add(!loginOk);

  sleep(1);
}
