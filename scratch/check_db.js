const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const BoothReportSchema = new mongoose.Schema({
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  }
}, { strict: false });

const BoothReport = mongoose.model('BoothReport', BoothReportSchema);

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected');
    const count = await BoothReport.countDocuments();
    console.log(`Total reports: ${count}`);
    const sample = await BoothReport.findOne();
    if (sample) {
      console.log('Sample report location:', JSON.stringify(sample.location));
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
