const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const locationRoutes = require('./routes/location');
const pulseRoutes = require('./routes/pulse');
const boothRoutes = require('./routes/booth');
const weatherRoutes = require('./routes/weather');
const chatRoutes = require('./routes/chat');
const leaderRoutes = require('./routes/leaders');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// Health Check
app.get('/', (req, res) => {
  res.json({ status: 'active', message: 'VoterPath Server is running' });
});

// Debug Route (Checks if API keys are present)
app.get('/api/debug', (req, res) => {
  res.json({
    mongodb: !!process.env.MONGODB_URI,
    gnews: !!process.env.GNEWS_API_KEY,
    weather: !!process.env.OPENWEATHER_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    env_keys: Object.keys(process.env).filter(k => !k.includes('PASS') && !k.includes('KEY') && !k.includes('SECRET'))
  });
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err.message));

app.use('/api/location', locationRoutes);
app.use('/api/pulse', pulseRoutes);
app.use('/api/booth-status', boothRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/leaders', leaderRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`VoterPath server running on port ${PORT}`);
});
