/**
 * Global Error Handler Middleware
 * Catches all errors passed via next(err) and returns structured JSON responses
 */

/**
 * 404 Not Found handler — use for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global error handler middleware
 * Must be registered LAST in Express middleware chain (4 arguments)
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Default to 500 if no status code set
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // ─── PostgreSQL-specific Errors ───────────────────────────────────────────
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        statusCode = 409;
        message = extractUniqueViolationMessage(err.detail || err.message);
        break;
      case '23503': // foreign_key_violation
        statusCode = 400;
        message = 'Referenced record does not exist.';
        break;
      case '23502': // not_null_violation
        statusCode = 400;
        message = `Field '${err.column}' cannot be null.`;
        break;
      case '22P02': // invalid_text_representation (e.g., bad UUID)
        statusCode = 400;
        message = 'Invalid ID format. Must be a valid UUID.';
        break;
      case '23514': // check_violation
        statusCode = 400;
        message = 'Value violates database constraint.';
        break;
      default:
        // Keep original message for other DB errors
        if (process.env.NODE_ENV !== 'production') {
          message = `Database error (${err.code}): ${err.message}`;
        } else {
          message = 'A database error occurred.';
        }
    }
  }

  // ─── JWT Errors ───────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired. Please login again.';
  }

  // ─── Validation Errors (express-validator) ────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 422;
  }

  // Log server errors (not 4xx client errors)
  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ERROR ${statusCode}:`, err);
  }

  // Build response
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && statusCode >= 500 && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

/**
 * Extract a user-friendly message from PostgreSQL unique violation detail
 * e.g., "Key (email)=(test@test.com) already exists."
 */
const extractUniqueViolationMessage = (detail) => {
  if (!detail) return 'A record with this value already exists.';
  const match = detail.match(/Key \((.+?)\)=\((.+?)\) already exists/);
  if (match) {
    return `${match[1].replace(/_/g, ' ')} '${match[2]}' is already taken.`;
  }
  return 'A record with this value already exists.';
};

/**
 * Helper: Create a custom API error
 */
const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { errorHandler, notFound, createError };
