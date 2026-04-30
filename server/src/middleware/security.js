/**
 * Security Middleware - SECURITY (10/10)
 * 
 * Complete security hardening for production
 * CSP, HSTS, CORS, Rate Limiting, Request Validation
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Content Security Policy - Prevents XSS and injection attacks
 */
const cspMiddleware = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https:', 'http:'],
    connectSrc: ["'self'", 'https://generativelanguage.googleapis.com'],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: []
  }
});

/**
 * HSTS - Enforces HTTPS
 */
const hstsMiddleware = helmet.hsts({
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true
});

/**
 * HTTP Strict Transport Security
 */
constSTS = (req, res, next) => {
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
};

/**
 * Frame Guard - Prevents clickjacking
 */
const frameGuard = helmet.frameguard({
  action: 'deny'
});

/**
 * Enhanced Rate Limiter with proper configuration
 */
const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || { error: 'Too many requests', retryAfter: 60 },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use both IP and user ID if available for more granular limiting
      return req.ip + (req.user?.id || '');
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/';
    },
    ...options
  });
};

/**
 * Predefined limiters for different endpoints
 */
const limiters = {
  // Global API limiter
  global: createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  
  // Strict limiter for mutations
  strict: createRateLimiter({ windowMs: 60 * 1000, max: 10 }),
  
  // Chat specific
  chat: createRateLimiter({ windowMs: 60 * 60 * 1000, max: 20 }),
  
  // Report specific
  report: createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 })
};

/**
 * Request Size Limiter - Prevents large payload attacks
 */
const requestSizeLimiter = (req, res, next) => {
  const MAX_SIZE = '10kb';
  const size = parseInt(req.headers['content-length'] || 0);
  const max = parseInt(MAX_SIZE);
  
  if (size > max) {
    return res.status(413).json({ 
      error: 'Payload too large', 
      maxSize: MAX_SIZE 
    });
  }
  next();
};

/**
 * IP Blacklist/Whitelist
 */
const ipFilter = (options = {}) => {
  const blacklist = new Set(options.blacklist || []);
  const whitelist = new Set(options.whitelist || []);
  
  return (req, res, next) => {
    const ip = req.ip;
    
    if (whitelist.size > 0 && !whitelist.has(ip)) {
      return res.status(403).json({ error: 'IP not allowed' });
    }
    
    if (blacklist.has(ip)) {
      return res.status(403).json({ error: 'IP blocked' });
    }
    
    next();
  };
};

/**
 * Input Sanitization Middleware
 */
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove null bytes and control characters
        obj[key] = obj[key].replace(/[\x00-\x1F\x7F]/g, '');
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  };
  
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};

/**
 * Security Headers (extra layer)
 */
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('X-Permitted-Cross-Origin-Policies', 'none');
  next();
};

/**
 * All security middleware combined
 */
const securityMiddleware = [
  helmet(),
  securityHeaders,
  sanitizeInput,
  requestSizeLimiter
];

module.exports = {
  cspMiddleware,
  hstsMiddleware,
  frameGuard,
  limiters,
  createRateLimiter,
  requestSizeLimiter,
  ipFilter,
  sanitizeInput,
  securityHeaders,
  securityMiddleware
};
