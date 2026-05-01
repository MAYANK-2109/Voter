/**
 * AppError - VOTE-पथ 2.0
 * Custom error hierarchy for structured error handling.
 */

class AppError extends Error {
  constructor(message, statusCode, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      message: this.message,
      errorCode: this.errorCode,
      statusCode: this.statusCode,
      timestamp: this.timestamp
    };
  }
}

class ValidationError extends AppError {
  constructor(message, field) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field
    };
  }
}

class RateLimitError extends AppError {
  constructor(retryAfterSeconds) {
    super('Too many requests. Please try again later.', 429, 'RATE_LIMIT_ERROR');
    this.retryAfter = retryAfterSeconds;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter
    };
  }
}

class ErrorFactory {
  static validation(message, field) {
    return new ValidationError(message, field);
  }

  static rateLimit(retryAfter) {
    return new RateLimitError(retryAfter);
  }

  static internal(message) {
    return new AppError(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

module.exports = {
  AppError,
  ValidationError,
  RateLimitError,
  ErrorFactory
};
