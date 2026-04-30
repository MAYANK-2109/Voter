const mongoose = require('mongoose');

const boothInsightSchema = new mongoose.Schema({
  boothId: { type: String, required: true, unique: true },
  historicalCrowdPeak: { type: String, default: '11:00 AM - 1:00 PM' },
  easeOfAccess: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  amenities: [{ type: String }], // e.g., ["Drinking Water", "Wheelchair Ramp", "Waiting Area", "Shade"]
  pastTurnout: { type: String, default: '0%' },
  avgWaitTime: { type: String, default: '30 mins' },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BoothInsight', boothInsightSchema);
