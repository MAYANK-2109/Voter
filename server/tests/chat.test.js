import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock BEFORE everything else
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: function() {
      this.getGenerativeModel = () => ({
        startChat: () => ({
          sendMessage: () => Promise.resolve({
            response: { text: () => 'Mock AI Response' }
          })
        })
      });
    }
  };
});

import chatRouter from '../routes/chat';

const app = express();
app.use(express.json());
app.use('/api/chat', chatRouter);

describe('Chat API', () => {
  it('should return 400 if message is missing', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.status).toBe(400);
  });

  it('should return 200 and a reply for a valid message', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Hello' });
    
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Mock AI Response');
  });
});
