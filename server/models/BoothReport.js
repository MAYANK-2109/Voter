const mongoose = require('mongoose');

const boothReportSchema = new mongoose.Schema({
  boothId: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  },
  city: String,
  state: String,
  district: String,
  evmStatus: { type: String, enum: ['working', 'glitch', 'down'], default: 'working' },
  queueLength: { type: String, enum: ['empty', 'short', 'moderate', 'long', 'extreme'], default: 'moderate' },
  safetyStatus: { type: String, enum: ['peaceful', 'tense', 'disrupted'], default: 'peaceful' },
  reporterName: { type: String, default: 'Anonymous' },
  description: String,
  upvotes: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
});

// Performance Indexes
boothReportSchema.index({ location: '2dsphere' });
boothReportSchema.index({ boothId: 1 });
boothReportSchema.index({ state: 1, city: 1 });
boothReportSchema.index({ timestamp: -1 });

module.exports = mongoose.model('BoothReport', boothReportSchema);
