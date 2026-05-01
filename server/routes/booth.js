const express = require('express');
const router = express.Router();
const { isValidObjectId } = require('mongoose');
const BoothReport = require('../models/BoothReport');
const BoothInsight = require('../models/BoothInsight');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Server-side DOMPurify setup for XSS prevention
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Strips all HTML tags and event attributes from a user-supplied string.
 * Returns the input unchanged if it is not a string.
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
};

// Rate limiter for reporting — very restrictive to prevent spam
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Reporting limit reached. Please try again later.' },
});

const BoothReportSchema = z.object({
  boothId: z.string().min(1).max(50),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  city: z.string().optional(),
  state: z.string().optional(),
  evmStatus: z.enum(['working', 'glitch', 'down']),
  queueLength: z.enum(['empty', 'short', 'moderate', 'long', 'extreme']),
  safetyStatus: z.enum(['peaceful', 'tense', 'disrupted']),
  reporterName: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
});

// Fix #14: Field projection + .lean() — only fetch what the client actually needs,
// returning plain JS objects (~30% faster than Mongoose document instances).
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    let query = {};
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      let distanceM = parseFloat(radius);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: 'INVALID_COORDINATES' });
      }

      // Convert km → metres if value looks like km input (≤ 100)
      if (distanceM <= 100) distanceM *= 1000;

      query = {
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [longitude, latitude] },
            $maxDistance: distanceM,
          },
        },
      };
    }

    const reports = await BoothReport
      .find(query)
      .select('boothId evmStatus queueLength safetyStatus description city upvotes timestamp')
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    const summary = {
      total: reports.length,
      evm: { working: 0, glitch: 0, down: 0 },
      queue: { empty: 0, short: 0, moderate: 0, long: 0, extreme: 0 },
      safety: { peaceful: 0, tense: 0, disrupted: 0 },
    };

    for (const report of reports) {
      summary.evm[report.evmStatus]++;
      summary.queue[report.queueLength]++;
      summary.safety[report.safetyStatus]++;
    }

    // Efficiency: Cache-Control lets browser and CDN cache responses for 30s
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=10');
    return res.json({ summary, reports });
  } catch (error) {
    logger.error('Booth GET error', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Failed to fetch booth reports' });
  }
});

router.post('/', reportLimiter, async (req, res) => {
  try {
    const validation = BoothReportSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'INVALID_REPORT_DATA',
        details: validation.error.format(),
      });
    }

    const data = validation.data;

    // Transform to GeoJSON format required by the 2dsphere index
    const geoReport = {
      ...data,
      location: {
        type: 'Point',
        coordinates: [data.location.lng, data.location.lat],
      },
      // Sanitize free-text fields for XSS
      description: data.description ? sanitizeInput(data.description) : undefined,
      reporterName: data.reporterName ? sanitizeInput(data.reporterName) : undefined,
    };

    const report = new BoothReport(geoReport);
    await report.save();
    return res.status(201).json(report);
  } catch (err) {
    logger.error('Booth POST error', { error: err.message });
    const statusCode = err.status || 500;
    return res.status(statusCode).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
      code: err.code || 'INTERNAL_ERROR',
    });
  }
});

// Fix #3: Validate MongoDB ObjectId before touching the database to prevent
// CastError leaks and enumeration attacks.
router.patch('/:id/upvote', async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'INVALID_REPORT_ID' });
  }

  try {
    const report = await BoothReport.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Report not found' });
    return res.json(report);
  } catch (error) {
    logger.error('Upvote failed', { id: req.params.id, error: error.message });
    return res.status(500).json({ error: 'Failed to upvote report' });
  }
});

// Fix #4: Sanitize and validate boothId path param before using it as a DB query value.
router.get('/:id/insights', async (req, res) => {
  const boothId = req.params.id.slice(0, 50);
  if (!/^[\w-]+$/.test(boothId)) {
    return res.status(400).json({ error: 'INVALID_BOOTH_ID' });
  }

  try {
    const insight = await BoothInsight.findOne({ boothId }).lean();
    if (!insight) {
      return res.json({
        boothId,
        historicalCrowdPeak: 'Not Available',
        easeOfAccess: 'Medium',
        amenities: [],
        pastTurnout: 'N/A',
        avgWaitTime: 'N/A',
      });
    }
    return res.json(insight);
  } catch (error) {
    logger.error('Insight API error', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Failed to fetch booth insights' });
  }
});

module.exports = router;
