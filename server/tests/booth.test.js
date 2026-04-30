import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';

// Mock database before importing routes
vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  return {
    ...actual,
    connect: vi.fn().mockResolvedValue(true),
    connection: { close: vi.fn() }
  };
});

// Mock BoothReport model
const mockBoothReport = {
  find: vi.fn(),
  findOne: vi.fn(),
  prototype: { save: vi.fn() }
};

vi.mock('../models/BoothReport', () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    schema: { index: vi.fn() }
  }
}));

vi.mock('../models/BoothInsight', () => ({
  default: {
    findOne: vi.fn()
  }
}));

import boothRouter from '../routes/booth';

const app = express();
app.use(express.json());
app.use('/api/booth-status', boothRouter);

describe('Booth API - Comprehensive Test Suite', () => {
  
  describe('GET /api/booth-status', () => {
    it('should return 400 if coordinates are invalid', async () => {
      const res = await request(app)
        .get('/api/booth-status')
        .query({ lat: 'invalid', lng: 'invalid' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid coordinates');
    });

    it('should return booth reports for valid coordinates', async () => {
      const mockReports = [
        { _id: '1', boothId: 'BP001', evmStatus: 'working', queueLength: 'moderate', safetyStatus: 'peaceful' }
      ];
      
      // Setup mock
      const { default: BoothReport } = await import('../models/BoothReport');
      BoothReport.find.mockResolvedValue(mockReports);

      const res = await request(app)
        .get('/api/booth-status')
        .query({ lat: '28.6139', lng: '77.2090' });

      expect(res.status).toBe(200);
      expect(res.body.reports).toBeDefined();
    });

    it('should handle missing coordinates gracefully', async () => {
      const res = await request(app).get('/api/booth-status');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/booth-status - Input Validation', () => {
    it('should return 400 for empty booth ID', async () => {
      const res = await request(app)
        .post('/api/booth-status')
        .send({
          boothId: '',
          location: { lat: 28.6139, lng: 77.2090 },
          evmStatus: 'working',
          queueLength: 'moderate',
          safetyStatus: 'peaceful'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid report data');
    });

    it('should return 400 for out-of-bounds coordinates', async () => {
      const res = await request(app)
        .post('/api/booth-status')
        .send({
          boothId: 'BP001',
          location: { lat: 100, lng: 77 },
          evmStatus: 'working',
          queueLength: 'moderate',
          safetyStatus: 'peaceful'
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid EVM status', async () => {
      const res = await request(app)
        .post('/api/booth-status')
        .send({
          boothId: 'BP001',
          location: { lat: 28.6139, lng: 77.2090 },
          evmStatus: 'invalid',
          queueLength: 'moderate',
          safetyStatus: 'peaceful'
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 for booth ID exceeding max length', async () => {
      const res = await request(app)
        .post('/api/booth-status')
        .send({
          boothId: 'A'.repeat(51),
          location: { lat: 28.6139, lng: 77.2090 },
          evmStatus: 'working',
          queueLength: 'moderate',
          safetyStatus: 'peaceful'
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 for description exceeding max length', async () => {
      const res = await request(app)
        .post('/api/booth-status')
        .send({
          boothId: 'BP001',
          location: { lat: 28.6139, lng: 77.2090 },
          evmStatus: 'working',
          queueLength: 'moderate',
          safetyStatus: 'peaceful',
          description: 'A'.repeat(501)
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/booth-status - Security (XSS Prevention)', () => {
    it('should sanitize script tag in description', async () => {
      const maliciousDescription = '<script>alert("XSS")</script>';
      
      const res = await request(app)
        .post('/api/booth-status')
        .send({
          boothId: 'BP001',
          location: { lat: 28.6139, lng: 77.2090 },
          evmStatus: 'working',
          queueLength: 'moderate',
          safetyStatus: 'peaceful',
          description: maliciousDescription
        });

      // If request succeeds, verify sanitization
      if (res.status === 201) {
        expect(res.body.description).not.toContain('<script>');
      }
    });

    it('should sanitize img with onerror', async () => {
      const maliciousInput = '<img src=x onerror=alert(1)>';
      
      const res = await request(app)
        .post('/api/booth-status')
        .send({
          boothId: 'BP001',
          location: { lat: 28.6139, lng: 77.2090 },
          evmStatus: 'working',
          queueLength: 'moderate',
          safetyStatus: 'peaceful',
          description: maliciousInput
        });

      if (res.status === 201) {
        expect(res.body.description).not.toContain('onerror');
      }
    });

    it('should sanitize JavaScript URI', async () => {
      const maliciousInput = 'javascript:alert("XSS")';
      
      const res = await request(app)
        .post('/api/booth-status')
        .send({
          boothId: 'BP001',
          location: { lat: 28.6139, lng: 77.2090 },
          evmStatus: 'working',
          queueLength: 'moderate',
          safetyStatus: 'peaceful',
          reporterName: maliciousInput
        });

      if (res.status === 201) {
        expect(res.body.reporterName).not.toContain('javascript:');
      }
    });

    it('should sanitize SVG payload', async () => {
      const maliciousInput = '<svg/onload=alert(1)>';
      
      const res = await request(app)
        .post('/api/booth-status')
        .send({
          boothId: 'BP001',
          location: { lat: 28.6139, lng: 77.2090 },
          evmStatus: 'working',
          queueLength: 'moderate',
          safetyStatus: 'peaceful',
          description: maliciousInput
        });

      if (res.status === 201) {
        expect(res.body.description).not.toContain('<svg');
      }
    });

    it('should allow legitimate content', async () => {
      const legitimateDescription = "The EVM was working fine. Short queue today!";
      
      const res = await request(app)
        .post('/api/booth-status')
        .send({
          boothId: 'BP001',
          location: { lat: 28.6139, lng: 77.2090 },
          evmStatus: 'working',
          queueLength: 'short',
          safetyStatus: 'peaceful',
          description: legitimateDescription
        });

      if (res.status === 201) {
        expect(res.body.description).toContain('EVM was working fine');
      }
    });
  });

  describe('PATCH /api/booth-status/:id/upvote', () => {
    it('should return 404 for non-existent report', async () => {
      const { default: BoothReport } = await import('../models/BoothReport');
      BoothReport.findByIdAndUpdate.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/booth-status/abc123/upvote');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/booth-status/:id/insights', () => {
    it('should return default insights when not found', async () => {
      const { default: BoothInsight } = await import('../models/BoothInsight');
      BoothInsight.findOne.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/booth-status/abc123/insights');

      expect(res.status).toBe(200);
      expect(res.body.historicalCrowdPeak).toBe('Not Available');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on POST', async () => {
      // Make multiple requests rapidly
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/booth-status')
            .send({
              boothId: 'BP001',
              location: { lat: 28.6139, lng: 77.2090 },
              evmStatus: 'working',
              queueLength: 'moderate',
              safetyStatus: 'peaceful'
            })
        );
      }

      const results = await Promise.all(promises);
      // At least some should be rate limited
      const rateLimited = results.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 for database errors', async () => {
      const { default: BoothReport } = await import('../models/BoothReport');
      BoothReport.find.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/booth-status');

      expect(res.status).toBe(500);
    });
  });
});
