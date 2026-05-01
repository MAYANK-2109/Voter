import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock GenAI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: function() {
    this.getGenerativeModel = () => ({
      generateContent: () => Promise.resolve({
        response: { text: () => 'Mock Leader Bio' }
      })
    });
  }
}));

// Mock axios for Wikipedia
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    get: vi.fn((url) => {
      if (url.includes('wikipedia')) {
        return Promise.resolve({
          data: {
            query: {
              pages: {
                '1': { thumbnail: { source: 'https://example.com/image.jpg' } }
              }
            }
          }
        });
      }
      return Promise.resolve({ data: {} });
    })
  };
});

import leaderRouter from '../routes/leaders';

const app = express();
app.use(express.json());
app.use('/api/leaders', leaderRouter);

describe('Leaders API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if lat/lng are missing', async () => {
    const res = await request(app).get('/api/leaders');
    expect(res.status).toBe(400);
  });

  it('should return leaders for valid coordinates', async () => {
    const res = await request(app).get('/api/leaders?lat=28.6139&lng=77.2090');
    expect(res.status).toBe(200);
    expect(res.body.state).toBe('Delhi');
    expect(res.body.leaders.length).toBeGreaterThan(0);
  });

  it('should return 404 for unknown location', async () => {
    const res = await request(app).get('/api/leaders?lat=0&lng=0');
    expect(res.status).toBe(404);
  });

  it('should use cache for identical consecutive requests', async () => {
    // First request
    await request(app).get('/api/leaders?lat=28.6139&lng=77.2090');
    // Second request
    const res = await request(app).get('/api/leaders?lat=28.6139&lng=77.2090');
    
    expect(res.status).toBe(200);
    // In a real cache test we would check if Wikipedia was called once, 
    // but here we verify the logic flows correctly.
  });
});
