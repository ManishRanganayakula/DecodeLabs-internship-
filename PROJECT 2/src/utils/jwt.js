const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generates a short-lived access token (default 24h) carrying the user id
 * and role, used to authenticate/authorize subsequent requests.
 */
const generateAccessToken = (payload) =>
  jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

/**
 * Generates a longer-lived refresh token used solely to mint new access
 * tokens without forcing the user to log in again.
 */
const generateRefreshToken = (payload) =>
  jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });

const verifyAccessToken = (token) => jwt.verify(token, config.jwt.secret);

const verifyRefreshToken = (token) => jwt.verify(token, config.jwt.refreshSecret);

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
