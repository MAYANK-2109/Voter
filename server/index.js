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

// Health Check
app.get('/', (req, res) => {
  res.json({ status: 'active', message: 'VoterPath Server is running' });
});

// Debug Route (Restricted to Development)
app.get('/api/debug', (req, res) => {
  // SECURITY: Completely disable debug endpoint in production
  // This prevents information leakage about server configuration
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // SECURITY: Only expose non-sensitive information
  // Never expose API key presence - this helps attackers target vulnerable services
  res.json({
    status: 'running',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
    // REMOVED: API key presence checking - was a security risk
    // Attackers can use key presence information to craft targeted attacks
  });
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
// SECURITY: Never expose internal error details to clients in production
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const timestamp = new Date().toISOString();
  
  // Log full error details server-side for debugging
  console.error(`[${timestamp}] ${req.method} ${req.url} >> Error ${statusCode}: ${err.message}`);
  
  // Only expose stack traces in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Stack trace:', err.stack);
  }

  // SECURITY: Generic error message for clients - prevents information leakage
  const clientMessage = statusCode >= 500 
    ? 'Internal Server Error' 
    : err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    error: clientMessage,
    timestamp: timestamp,
    // Only include request path for debugging (not sensitive)
    path: process.env.NODE_ENV !== 'production' ? req.url : undefined
    // SECURITY: Never expose stack traces, internal paths, or system info to clients
  });
});

app.listen(PORT, () => {
  console.log(`VoterPath server running on port ${PORT}`);
});
