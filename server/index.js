const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const locationRoutes = require('./routes/location');
const pulseRoutes = require('./routes/pulse');
const boothRoutes = require('./routes/booth');
const weatherRoutes = require('./routes/weather');
const chatRoutes = require('./routes/chat');
const leaderRoutes = require('./routes/leaders');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Optimization Middlewares
app.use(helmet()); // Basic security headers
app.use(compression()); // Gzip compression
app.use(morgan('dev')); // Request logging
app.use(express.json({ limit: '10kb' })); // Body parser with limit

// Restricted CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health Check & DB Diagnostics
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({ 
    status: 'active', 
    database: statusMap[dbStatus] || 'unknown',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Debug Route (Restricted to Development)
app.get('/api/debug', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.json({
    status: 'running',
    nodeVersion: process.version,
    dbReady: mongoose.connection.readyState === 1,
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB initial connection error:', err.message));

mongoose.connection.on('error', err => {
  console.error('MongoDB runtime error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
});

app.use('/api/location', locationRoutes);
app.use('/api/pulse', pulseRoutes);
app.use('/api/booth-status', boothRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/leaders', leaderRoutes);

// Global Error Handler
// SECURITY: Never expose internal error details to clients in production
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  logger.error('Unhandled Exception', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    code: err.code || 'INTERNAL_ERROR',
    path: process.env.NODE_ENV !== 'production' ? req.url : undefined
  });
});

app.listen(PORT, () => {
  console.log(`VoterPath server running on port ${PORT}`);
});