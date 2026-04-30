/**
 * Structured Logger - VOTE-पथ 2.0
 * 
 * OBSERVABILITY & MAINTAINABILITY: JSON-structured logging
 * Integrates with telemetry systems for production monitoring
 * Supports log levels, correlation IDs, and performance tracking
 */

// Log levels with numeric priorities
const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Current log level (configurable via environment)
const currentLevel = process.env.LOG_LEVEL 
  ? LogLevel[process.env.LOG_LEVEL.toUpperCase()] 
  : LogLevel.INFO;

/**
 * Structured Logger Class
 * Implements Open-Closed Principle: Extendable formatters without modifying core logic
 */
class StructuredLogger {
  constructor(options = {}) {
    this.service = options.service || 'voterpath';
    this.environment = process.env.NODE_ENV || 'development';
    this.enableColors = options.enableColors !== false && this.environment !== 'production';
    
    // Formatter plugins (Open for extension)
    this.formatters = {
      json: this._formatJSON.bind(this),
      simple: this._formatSimple.bind(this)
    };
    this.activeFormatter = options.format === 'json' ? 'json' : 'simple';
  }

  /**
   * Create correlated log entry
   */
  log(level, message, context = {}) {
    // Check log level
    if (LogLevel[level] > currentLevel) return;

    // Build log entry
    const entry = {
      // Temporal context
      timestamp: new Date().toISOString(),
      level: level,
      service: this.service,
      environment: this.environment,
      
      // Message
      message: message,
      
      // Correlation for request tracing
      correlationId: context.correlationId || this._generateCorrelationId(),
      traceId: context.traceId,
      
      // Performance metrics
      duration: context.duration,
      
      // Additional context
      ...context
    };

    // Remove undefined values
    Object.keys(entry).forEach(key => {
      if (entry[key] === undefined) delete entry[key];
    });

    // Format and output
    this._output(entry);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // LOG LEVEL METHODS
  // ═══════════════════════════════════════════════════════════════════════════════

  error(message, context) {
    this.log('ERROR', message, context);
  }

  warn(message, context) {
    this.log('WARN', message, context);
  }

  info(message, context) {
    this.log('INFO', message, context);
  }

  debug(message, context) {
    this.log('DEBUG', message, context);
  }

  trace(message, context) {
    this.log('TRACE', message, context);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PERFORMANCE TRACKING
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Wrap async function with automatic timing
   */
  async measure(name, fn) {
    const start = process.hrtime.bigint();
    try {
      const result = await fn();
      const duration = Number(process.hrtime.bigint() - start) / 1e6; // Convert to milliseconds
      
      this.info(`${name} completed`, { duration, success: true });
      return result;
    } catch (error) {
      const duration = Number(process.hrtime.bigint() - start) / 1e6;
      
      this.error(`${name} failed`, { 
        duration, 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // REQUEST TRACKING
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Create request logger middleware for Express
   */
  requestMiddleware(req, res, next) {
    const start = process.hrtime.bigint();
    
    // Capture correlation ID from header or generate new
    const correlationId = req.headers['x-correlation-id'] || this._generateCorrelationId();
    req.correlationId = correlationId;

    // Log on response finish
    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - start) / 1e6;
      
      this.info(`${req.method} ${req.originalUrl}`, {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        correlationId,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });
    });

    next();
  }

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════════

  _generateCorrelationId() {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _formatJSON(entry) {
    return JSON.stringify(entry);
  }

  _formatSimple(entry) {
    const color = this._getLevelColor(entry.level);
    const timestamp = entry.timestamp.split('T')[1].replace('Z', '');
    
    let line = `[${timestamp}] ${color}${entry.level.padEnd(5)}\x1b[0m ${entry.message}`;
    
    if (entry.duration) {
      line += ` \x1b[36m(${entry.duration.toFixed(1)}ms)\x1b[0m`;
    }
    if (entry.statusCode) {
      line += ` \x1b[36m${entry.statusCode}\x1b[0m`;
    }
    if (entry.correlationId) {
      line += ` \x1b[90m[${entry.correlationId}]\x1b[0m`;
    }
    
    return line;
  }

  _getLevelColor(level) {
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[32m',  // Green
      DEBUG: '\x1b[36m', // Cyan
      TRACE: '\x1b[90m'  // Gray
    };
    return colors[level] || '\x1b[0m';
  }

  _output(entry) {
    const formatter = this.formatters[this.activeFormatter];
    const output = formatter(entry);
    
    // Write to appropriate output
    if (this.environment === 'production') {
      // In production, also write to file or external logging service
      console.log(output);
    } else {
      console.log(output);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════���
// LOGGER EXPORTS (Singleton)
// ═══════════════════════════════════════════════════════════════════════════════

const logger = new StructuredLogger({
  service: 'voterpath-server',
  format: process.env.LOG_FORMAT || 'json'
});

module.exports = {
  logger,
  StructuredLogger,
  LogLevel
};
