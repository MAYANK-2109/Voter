const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const BoothInsight = require('./models/BoothInsight');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    const count = await BoothInsight.countDocuments();
    console.log('Total insights:', count);
    const insights = await BoothInsight.find();
    console.log('Insights:', JSON.stringify(insights, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkDB();
