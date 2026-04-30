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
    const reports = await BoothReport.find().limit(10);
    console.log(`Found ${reports.length} reports.`);
    reports.forEach(r => {
      console.log(`- ID: ${r._id}, Location: ${JSON.stringify(r.location)}`);
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
