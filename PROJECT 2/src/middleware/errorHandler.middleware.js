const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * Translates known third-party/library errors (Mongoose, JWT, Multer)
 * into our standard ApiError shape so the response contract never leaks
 * library-specific error formats to API consumers.
 */
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiError.unprocessable('Validation failed', errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiError.conflict(`${field} already exists`, [
      { field, message: `This ${field} is already registered` },
    ]);
  }

  // Mongoose invalid ObjectId cast
  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiError.unauthorized('Invalid authentication token');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Authentication token has expired');
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    return ApiError.badRequest(`File upload error: ${err.message}`);
  }

  // Fallback: unknown/unexpected error -> 500, never leak internals in prod
  return ApiError.internal(config.env === 'production' ? 'Internal server error' : err.message);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const apiError = normalizeError(err);

  if (!apiError.isOperational || apiError.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.stack || err.message}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${apiError.statusCode} ${apiError.message}`);
  }

  const response = {
    success: false,
    message: apiError.message,
    errors: apiError.errors || [],
  };

  if (config.env === 'development' && apiError.statusCode >= 500) {
    response.stack = err.stack;
  }

  res.status(apiError.statusCode).json(response);
};

module.exports = errorHandler;
