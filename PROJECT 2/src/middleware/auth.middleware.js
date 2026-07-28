const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User.model');
const { MESSAGES } = require('../constants');

/**
 * Protects a route by requiring a valid Bearer access token.
 * Attaches the authenticated user document to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    [, token] = req.headers.authorization.split(' ');
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw ApiError.unauthorized(MESSAGES.UNAUTHORIZED);
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized(MESSAGES.TOKEN_EXPIRED);
    }
    throw ApiError.unauthorized(MESSAGES.TOKEN_INVALID);
  }

  const currentUser = await User.findById(decoded.id).select('+passwordChangedAt');
  if (!currentUser) {
    throw ApiError.unauthorized('The user belonging to this token no longer exists');
  }

  if (!currentUser.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Contact an administrator.');
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    throw ApiError.unauthorized('Password was recently changed. Please log in again.');
  }

  req.user = currentUser;
  next();
});

/**
 * Optional auth: attaches req.user if a valid token is present, but never
 * throws — useful for endpoints with different behavior for guests vs users.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  try {
    const [, token] = authHeader.split(' ');
    const decoded = verifyAccessToken(token);
    const currentUser = await User.findById(decoded.id);
    if (currentUser && currentUser.isActive) req.user = currentUser;
  } catch (error) {
    // Silently ignore invalid tokens for optional auth
  }
  next();
});

module.exports = { protect, optionalAuth };
