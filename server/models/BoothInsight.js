const mongoose = require('mongoose');

const boothInsightSchema = new mongoose.Schema({
  // Fix #10: `unique: true` removed from field definition — uniqueness is
  // enforced exclusively by the index below, eliminating the duplicate-index
  // warning that Mongoose emits when both are present simultaneously.
  boothId: { type: String, required: true },
  historicalCrowdPeak: { type: String, default: '11:00 AM - 1:00 PM' },
  easeOfAccess: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  amenities: [{ type: String }],
  pastTurnout: { type: String, default: '0%' },
  avgWaitTime: { type: String, default: '30 mins' },
  lastUpdated: { type: Date, default: Date.now },
});

// Single source of truth for the unique constraint
boothInsightSchema.index({ boothId: 1 }, { unique: true });
boothInsightSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('BoothInsight', boothInsightSchema);
