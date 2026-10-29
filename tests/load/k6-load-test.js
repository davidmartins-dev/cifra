import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '3s', target: 20 },  // Ramp-up rápido até 20 usuários simultâneos
    { duration: '10s', target: 20 }, // Sustenta 20 usuários virtuais (carga)
    { duration: '2s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],         // Menos de 1% de falhas permitidas
    http_req_duration: ['p(95)<250'],       // 95% das requisições devem responder em menos de 250ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';

export default function () {
  // 1. Healthcheck e status do banco
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'healthcheck status is 200': (r) => r.status === 200,
    'database is up': (r) => r.json('database') === 'up',
  });

  sleep(0.1);
}
