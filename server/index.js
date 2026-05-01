// MUST be first — populates process.env before any route module reads it at load time
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const requestId = require('express-request-id').default;

// Fix: Logger imported AFTER dotenv so Winston file paths resolve correctly
const logger = require('./utils/logger');

const locationRoutes = require('./routes/location');
const pulseRoutes   = require('./routes/pulse');
const boothRoutes   = require('./routes/booth');
const weatherRoutes = require('./routes/weather');
const chatRoutes    = require('./routes/chat');
const leaderRoutes  = require('./routes/leaders');

const app  = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5001;

// ─── Security: attach X-Request-Id to every request & response ───────────────
app.use(requestId());

// ─── Security: HTTP hardening headers ─────────────────────────────────────────
app.use(helmet());

// ─── Security: Content Security Policy ────────────────────────────────────────
// Tightened to only allow same-origin scripts; adjust if you add a CDN.
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],   // Tailwind inlines styles in dev
      imgSrc:      ["'self'", 'data:', 'https:'],   // Allow https images (Wikipedia etc.)
      connectSrc:  ["'self'"],
      fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));

// ─── Security: Robust CORS ────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
}));

// ─── Security: Global rate limiter ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.id || req.ip,   // attach requestId to rate-limit key
});
app.use('/api/', limiter);

// ─── Health Check & DB Diagnostics ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const statusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'active',
    database: statusMap[mongoose.connection.readyState] || 'unknown',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    requestId: req.id,
  });
});

// ─── Debug Route (Development only) ──────────────────────────────────────────
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
    timestamp: new Date().toISOString(),
  });
});

// ─── Database ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
})
  .then(() => logger.info('Connected to MongoDB Atlas'))
  .catch(err => logger.error('MongoDB initial connection error', { error: err.message }));

mongoose.connection.on('error',        err => logger.error('MongoDB runtime error',   { error: err.message }));
mongoose.connection.on('disconnected', ()  => logger.warn('MongoDB disconnected. Attempting to reconnect...'));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/location',     locationRoutes);
app.use('/api/pulse',        pulseRoutes);
app.use('/api/booth-status', boothRoutes);
app.use('/api/weather',      weatherRoutes);
app.use('/api/chat',         chatRoutes);
app.use('/api/leaders',      leaderRoutes);

// ─── Global Error Handler ─────────────────────────────────────────────────────
// SECURITY: never expose stack traces to clients in production
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  logger.error('Unhandled Exception', {
    requestId: req.id,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    code: err.code || 'INTERNAL_ERROR',
    requestId: req.id,
    path: process.env.NODE_ENV !== 'production' ? req.url : undefined,
  });
});

app.listen(PORT, () => logger.info(`VoterPath server running on port ${PORT}`));