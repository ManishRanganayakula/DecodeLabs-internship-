const rateLimit = require('express-rate-limit');
const config = require('../config/env');

/**
 * General API rate limiter applied globally.
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
    errors: [],
  },
});

/**
 * Stricter limiter for auth endpoints (login/register/forgot-password)
 * to slow down brute-force and credential-stuffing attempts.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    errors: [],
  },
});

module.exports = { apiLimiter, authLimiter };
