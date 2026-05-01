import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import axios from 'axios';

vi.mock('axios');

import pulseRouter from '../routes/pulse';

const app = express();
app.use(express.json());
app.use('/api/pulse', pulseRouter);

describe('Pulse News API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('GNEWS_API_KEY', 'valid_gnews');
    vi.stubEnv('NEWSDATA_API_KEY', 'valid_newsdata');
  });

  it('should return articles from GNews on success', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        articles: [{ title: 'GNews Article', url: 'https://gnews.io' }]
      }
    });

    const res = await request(app).get('/api/pulse?lat=28.6&lng=77.2');
    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('GNews');
    expect(res.body.articles[0].title).toBe('GNews Article');
  });

  it('should fallback to NewsData if GNews fails', async () => {
    // GNews fails
    axios.get.mockRejectedValueOnce(new Error('GNews Down'));
    // NewsData succeeds
    axios.get.mockResolvedValueOnce({
      data: {
        results: [{ title: 'NewsData Article', link: 'https://newsdata.io' }]
      }
    });

    const res = await request(app).get('/api/pulse?lat=28.6&lng=77.2');
    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('NewsData');
    expect(res.body.articles[0].title).toBe('NewsData Article');
  });

  it('should fallback to mock/persistent news if both providers fail', async () => {
    axios.get.mockRejectedValue(new Error('All APIs Down'));

    const res = await request(app).get('/api/pulse?lat=28.6&lng=77.2');
    expect(res.status).toBe(200);
    expect(res.body.isFallback).toBe(true);
  });
});
