const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const { MESSAGES } = require('../constants');

/**
 * Runs after an array of express-validator checks. Collects any
 * validation errors and throws a single, uniformly-shaped ApiError
 * (422) so controllers stay free of validation boilerplate.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
    value: err.value,
  }));

  throw ApiError.unprocessable(MESSAGES.VALIDATION_FAILED, formatted);
};

module.exports = validate;
