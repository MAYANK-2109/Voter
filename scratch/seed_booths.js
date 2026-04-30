const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const BoothReportSchema = new mongoose.Schema({
  boothId: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  city: String,
  state: String,
  evmStatus: String,
  queueLength: String,
  safetyStatus: String,
  reporterName: String,
  description: String,
  timestamp: { type: Date, default: Date.now }
}, { strict: false });

const BoothReport = mongoose.model('BoothReport', BoothReportSchema);

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const sampleReports = [
      {
        boothId: "B-001",
        location: { type: "Point", coordinates: [81.605, 21.252] },
        city: "Raipur",
        state: "Chhattisgarh",
        evmStatus: "working",
        queueLength: "short",
        safetyStatus: "peaceful",
        reporterName: "Mayank",
        description: "Smooth voting process at Government Primary School."
      },
      {
        boothId: "B-002",
        location: { type: "Point", coordinates: [81.608, 21.255] },
        city: "Raipur",
        state: "Chhattisgarh",
        evmStatus: "glitch",
        queueLength: "long",
        safetyStatus: "tense",
        reporterName: "Voter123",
        description: "One EVM is down, queue is moving slowly."
      }
    ];

    await BoothReport.insertMany(sampleReports);
    console.log('Seeded 2 reports in Raipur.');
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

seed();
