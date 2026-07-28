const ApiError = require('../utils/ApiError');

/**
 * Catches any request that didn't match a defined route and forwards
 * a standard 404 ApiError to the central error handler.
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;
