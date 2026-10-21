import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. Configuración del perfil de carga 
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp-up: Subir paulatinamente a 20 usuarios en 30s
    { duration: '1m',  target: 100 }, // Carga sostenida: Mantener 100 usuarios concurrentes durante 1 min
    { duration: '30s', target: 200 }, // Estrés pico: Escalar a 200 usuarios concurrentes en 30s
    { duration: '30s', target: 0 },   // Ramp-down: Reducir progresivamente a 0
  ],
  thresholds: {
    // Defino los Slos / criterios de éxito para la tesis
    http_req_failed: ['rate<0.01'],   // Menos del 1% de errores HTTP aceptados
    http_req_duration: ['p(95)<500'], // El 95% de las peticiones deben responder en menos de 500 ms
  },
};

const BASE_URL = 'http://localhost:9000'; // Ajustar la URL/Puerto segun el entorno de ejecucion

export default function () {
  // Scenario 1: Lectura M2M protegida con ApiKeyGuard
  const m2mHeaders = {
    'Content-Type': 'application/json',
    'X-API-Key': 'sk_86535453fbbd82c8a666b94b6a63163c1e9ae43c69e64abeb37a9537b68db291', // Reemplazar por una API Key valida de prueba
  };

  const resRoles = http.get(`${BASE_URL}/roles/get-roles`, { headers: m2mHeaders });

  check(resRoles, {
    'M2M Roles: Status es 200': (r) => r.status === 200,
    'M2M Roles: Tiempo de respuesta < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(0.5); // Pausa breve de procesamiento entre interacciones

  // Scenario 2: Login / Computo de Hashing con Bcrypt
  const loginPayload = JSON.stringify({
    email: 'usuario@empresa.com', //reemplazar por un usuario de prueba
    password: 'usuario@empresa.com',
  });

  const authHeaders = {
    'Content-Type': 'application/json',
  };

  const resLogin = http.post(`${BASE_URL}/auth/login`, loginPayload, { headers: authHeaders });

  check(resLogin, {
    'Auth Login: Status es 200 o 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}