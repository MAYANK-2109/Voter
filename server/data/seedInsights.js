const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const BoothInsight = require('../models/BoothInsight');

dotenv.config({ path: path.join(__dirname, '../.env') });

const insights = [
  {
    boothId: '1',
    historicalCrowdPeak: '10:30 AM - 12:30 PM',
    easeOfAccess: 'High',
    amenities: ['Drinking Water', 'Wheelchair Ramp', 'Waiting Area', 'First Aid'],
    pastTurnout: '74.2%',
    avgWaitTime: '40 mins'
  },
  {
    boothId: '2',
    historicalCrowdPeak: '9:00 AM - 11:00 AM',
    easeOfAccess: 'Medium',
    amenities: ['Drinking Water', 'Shade'],
    pastTurnout: '62.8%',
    avgWaitTime: '55 mins'
  },
  {
    boothId: '3',
    historicalCrowdPeak: '4:00 PM - 6:00 PM',
    easeOfAccess: 'High',
    amenities: ['Drinking Water', 'Wheelchair Ramp', 'Fans', 'Separate Queue for Seniors'],
    pastTurnout: '81.5%',
    avgWaitTime: '25 mins'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing insights
    await BoothInsight.deleteMany({});
    console.log('Cleared existing insights');

    // Insert new insights
    await BoothInsight.insertMany(insights);
    console.log('Seeded booth insights successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDB();
