import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import axios from 'axios';

vi.mock('axios');

import router from '../routes/weather.js';

const app = express();
app.use(express.json());
app.use('/api/weather', router);

describe('Weather Route - 100% Branch Coverage Test', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('OPENWEATHER_API_KEY', 'valid_test_key_123');
  });

  it('should return 400 for invalid params', async () => {
    const res = await request(app).get('/api/weather?lat=invalid&lng=100');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_PARAMS');
  });

  it('should return 200 for valid weather', async () => {
    axios.get.mockResolvedValue({
      data: {
        main: { temp: 20, feels_like: 22, humidity: 40 },
        weather: [{ main: 'Clear' }],
        name: 'Raipur'
      }
    });

    // Use unique coords to avoid cache interference
    const res = await request(app).get('/api/weather?lat=10.00&lng=20.00');
    expect(res.status).toBe(200);
  });

  it('should return 401 for placeholder key', async () => {
    vi.stubEnv('OPENWEATHER_API_KEY', 'placeholder');
    const res = await request(app).get('/api/weather?lat=30.00&lng=40.00');
    expect(res.status).toBe(401);
  });

  it('should return 500 for network failure', async () => {
    vi.stubEnv('OPENWEATHER_API_KEY', 'valid_test_key_456');
    axios.get.mockRejectedValue(new Error('Down'));
    const res = await request(app).get('/api/weather?lat=50.00&lng=60.00');
    expect(res.status).toBe(500);
  });
});
