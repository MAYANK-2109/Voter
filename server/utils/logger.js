const winston = require('winston');
require('winston-daily-rotate-file');

// ─── Log rotation transport (production) ─────────────────────────────────────
// Keeps 14 days of compressed daily log files; prevents unbounded disk growth.
const rotatingErrorTransport = new winston.transports.DailyRotateFile({
  filename:    'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level:       'error',
  maxSize:     '20m',
  maxFiles:    '14d',
  zippedArchive: true,
});

const rotatingCombinedTransport = new winston.transports.DailyRotateFile({
  filename:    'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize:     '20m',
  maxFiles:    '14d',
  zippedArchive: true,
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'voterpath-api' },
  transports: [
    rotatingErrorTransport,
    rotatingCombinedTransport,
  ],
});

// Pretty console output in non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

module.exports = logger;
