/**
 * Custom operational error class. Anything thrown as an ApiError is treated
 * as a "known" error by the central error handler and returned with the
 * standard error response shape instead of a generic 500.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human readable error message
   * @param {Array} errors - Array of field-level validation errors (optional)
   * @param {boolean} isOperational - Whether this is a known/expected error
   */
  constructor(statusCode, message = 'Something went wrong', errors = [], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    this.success = false;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }

  static unprocessable(message = 'Unprocessable entity', errors = []) {
    return new ApiError(422, message, errors);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, [], false);
  }
}

module.exports = ApiError;
