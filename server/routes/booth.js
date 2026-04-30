const express = require('express');
const router = express.Router();
const BoothReport = require('../models/BoothReport');
const BoothInsight = require('../models/BoothInsight');

router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius = 0.5 } = req.query;

    let query = {};
    if (lat && lng) {
      const r = parseFloat(radius);
      query = {
        'location.lat': { $gte: parseFloat(lat) - r, $lte: parseFloat(lat) + r },
        'location.lng': { $gte: parseFloat(lng) - r, $lte: parseFloat(lng) + r }
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

router.post('/', async (req, res) => {
  try {
    const report = new BoothReport(req.body);
    await report.save();
    res.status(201).json(report);
  } catch (error) {
    console.error('Booth report error:', error.message);
    res.status(400).json({ error: error.message });
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
