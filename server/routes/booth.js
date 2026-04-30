const express = require('express');
const router = express.Router();
const BoothReport = require('../models/BoothReport');
const BoothInsight = require('../models/BoothInsight');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Server-side DOMPurify setup for XSS prevention
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * SanitizeInput - XSS Prevention
 * Uses DOMPurify to strip all malicious code from user inputs
 * @param {string} input - Raw user input
 * @returns {string} Sanitized output
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  });
};

// Rate limiter for reporting (very restrictive to prevent spam)
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 reports per hour
  message: { error: 'Reporting limit reached. Please try again later.' }
});

const BoothReportSchema = z.object({
  boothId: z.string().min(1).max(50),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  city: z.string().optional(),
  state: z.string().optional(),
  evmStatus: z.enum(['working', 'glitch', 'down']),
  queueLength: z.enum(['empty', 'short', 'moderate', 'long', 'extreme']),
  safetyStatus: z.enum(['peaceful', 'tense', 'disrupted']),
  reporterName: z.string().max(100).optional(),
  description: z.string().max(500).optional()
});

router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius = 0.5 } = req.query;

    let query = {};
    if (lat && lng) {
      const r = parseFloat(radius);
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: 'Invalid coordinates' });
      }

      query = {
        'location.lat': { $gte: latitude - r, $lte: latitude + r },
        'location.lng': { $gte: longitude - r, $lte: longitude + r }
      };
    }

    const reports = await BoothReport.find(query).sort({ timestamp: -1 }).limit(50);

    const summary = {
      total: reports.length,
      evm: { working: 0, glitch: 0, down: 0 },
      queue: { empty: 0, short: 0, moderate: 0, long: 0, extreme: 0 },
      safety: { peaceful: 0, tense: 0, disrupted: 0 }
    };

    reports.forEach(r => {
      summary.evm[r.evmStatus]++;
      summary.queue[r.queueLength]++;
      summary.safety[r.safetyStatus]++;
    });

    res.json({ summary, reports });
  } catch (error) {
    console.error('Booth API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch booth reports' });
  }
});

router.post('/', reportLimiter, async (req, res) => {
  try {
    const validation = BoothReportSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid report data', 
        details: validation.error.format() 
      });
    }

// Comprehensive XSS prevention using DOMPurify
    const data = validation.data;
    if (data.description) {
      data.description = sanitizeInput(data.description);
    }
    if (data.reporterName) {
      data.reporterName = sanitizeInput(data.reporterName);
    }

    const report = new BoothReport(data);
    await report.save();
    res.status(201).json(report);
  } catch (error) {
    console.error('Booth report error:', error.message);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

router.patch('/:id/upvote', async (req, res) => {
  try {
    const report = await BoothReport.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upvote report' });
  }
});

router.get('/:id/insights', async (req, res) => {
  try {
    const insight = await BoothInsight.findOne({ boothId: req.params.id });
    if (!insight) {
      // Return default or empty if not found
      return res.json({
        boothId: req.params.id,
        historicalCrowdPeak: 'Not Available',
        easeOfAccess: 'Medium',
        amenities: [],
        pastTurnout: 'N/A',
        avgWaitTime: 'N/A'
      });
    }
    res.json(insight);
  } catch (error) {
    console.error('Insight API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch booth insights' });
  }
});

module.exports = router;
