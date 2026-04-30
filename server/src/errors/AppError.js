/**
 * Custom Exception Types - VOTE-पथ 2.0
 * 
 * Fail-Safe Architecture: Custom exception hierarchy for robust error handling
 * Open-Closed Principle: Extendable error codes without modifying existing logic
 */

class AppError extends Error {
  constructor(message, statusCode, errorCode, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.stack = process.env.NODE_ENV !== 'production' ? this.stack : undefined;
    
    // Proper prototype chain for instanceof checks
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errorCode: this.errorCode,
      timestamp: this.timestamp,
      // Only expose stack trace in development
      ...(process.env.NODE_ENV !== 'production' && { stack: this.stack })
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESILIENCE: Domain-Specific Error Types
// ═══════════════════════════════════════════════════════════════════════════════

class ValidationError extends AppError {
  constructor(message, field, details = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHZ_ERROR');
  }
}

class ResourceNotFoundError extends AppError {
  constructor(resource, identifier) {
    super(`${resource} not found: ${identifier}`, 404, 'NOT_FOUND');
    this.resource = resource;
    this.identifier = identifier;
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('Too many requests', 429, 'RATE_LIMIT');
    this.retryAfter = retryAfter;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCALABILITY: External Service Errors (Circuit Breaker Pattern)
// ═══════════════════════════════════════════════════════════════════════════════

class ExternalServiceError extends AppError {
  constructor(service, originalError) {
    super(`${service} unavailable: ${originalError.message}`, 503, 'SERVICE_UNAVAILABLE');
    this.service = service;
    this.originalError = originalError.message;
  }
}

class CircuitBreakerError extends AppError {
  constructor(service) {
    super(`Circuit breaker open for ${service}`, 503, 'CIRCUIT_BREAKER');
    this.service = service;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY: Security-Specific Errors
// ═══════════════════════════════════════════════════════════════════════════════

class SecurityError extends AppError {
  constructor(message, securityCode) {
    super(message, 403, securityCode);
  }
}

class InputSanitizationError extends SecurityError {
  constructor(details) {
    super('Invalid input detected', 'INPUT_SANITIZATION');
    this.details = details;
  }
}

class ThreatDetectionError extends SecurityError {
  constructor(threatType, details) {
    super(`Security threat detected: ${threatType}`, 'THREAT_DETECTED');
    this.threatType = threatType;
    this.details = details;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR CODE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const ErrorCodes = {
  // Validation (1xxx)
  MISSING_REQUIRED_FIELD: 1001,
  INVALID_FIELD_FORMAT: 1002,
  FIELD_TOO_LONG: 1003,
  FIELD_TOO_SHORT: 1004,
  ENUM_MISMATCH: 1005,
  
  // Authentication (2xxx)
  TOKEN_EXPIRED: 2001,
  TOKEN_INVALID: 2002,
  TOKEN_MISSING: 2003,
  SESSION_EXPIRED: 2004,
  
  // Resources (3xxx)
  RESOURCE_NOT_FOUND: 3001,
  RESOURCE_CONFLICT: 3002,
  
  // Rate Limiting (4xxx)
  RATE_LIMIT_EXCEEDED: 4001,
  
  // External Services (5xxx)
  EXTERNAL_API_TIMEOUT: 5001,
  EXTERNAL_API_FAILED: 5002,
  EXTERNAL_API_QUOTA_EXCEEDED: 5003,
  
  // Security (6xxx)
  SQL_INJECTION_DETECTED: 6001,
  XSS_ATTEMPT_DETECTED: 6002,
  REQUEST_TOO_LARGE: 6003,
  SUSPICIOUS_PATTERN: 6004,
  
  // Internal (9xxx)
  INTERNAL_ERROR: 9001,
  DATABASE_ERROR: 9002,
  CACHE_ERROR: 9003
};

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLER FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

const ErrorFactory = {
  /**
   * Create validation error with field context
   */
  validation: (message, field, details) => new ValidationError(message, field, details),
  
  /**
   * Create external service error with circuit breaker check
   */
  service: (service, error, circuitThreshold) => {
    // In production, this would check circuit breaker state
    if (circuitThreshold && circuitThreshold.isOpen()) {
      return new CircuitBreakerError(service);
    }
    return new ExternalServiceError(service, error);
  },
  
  /**
   * Security error with threat classification
   */
  security: (threatType, details) => {
    if (threatType === 'sql_injection' || threatType === 'xss') {
      return new ThreatDetectionError(threatType, details);
    }
    return new SecurityError('Security policy violation', 'POLICY_VIOLATION');
  },
  
  /**
   * Standardize MongoDB errors
   */
  mongoDB: (error) => {
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message, '_id', error.errors);
    }
    if (error.name === 'CastError') {
      return new ValidationError(`Invalid ${error.path}`, error.path);
    }
    // Handle duplicate key errors
    if (error.code === 11000) {
      return new AppError('Resource already exists', 409, 'DUPLICATE_KEY');
    }
    return new AppError('Database operation failed', 500, 'DB_ERROR');
  }
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ResourceNotFoundError,
  RateLimitError,
  ExternalServiceError,
  CircuitBreakerError,
  SecurityError,
  InputSanitizationError,
  ThreatDetectionError,
  ErrorCodes,
  ErrorFactory
};
