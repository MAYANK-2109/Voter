import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failure rate
  },
};

const BASE_URL = 'http://localhost:5001/api';

export default function () {
  // Test Weather API (Cache check)
  const weatherRes = http.get(`${BASE_URL}/weather?lat=28.6139&lng=77.2090`);
  check(weatherRes, {
    'weather status is 200': (r) => r.status === 200,
    'weather has city': (r) => JSON.parse(r.body).city !== undefined,
  });

  // Test Booth Status List
  const boothRes = http.get(`${BASE_URL}/booth-status?lat=28.6139&lng=77.2090&radius=1.0`);
  check(boothRes, {
    'booth status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
