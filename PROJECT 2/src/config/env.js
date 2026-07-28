/**
 * Centralized environment configuration.
 * All process.env access in the app should go through this file so that
 * defaults, parsing and validation live in exactly one place.
 */
require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET'];

// Fail fast in non-test environments if critical secrets are missing.
if (process.env.NODE_ENV !== 'test') {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiVersion: process.env.API_VERSION || 'v1',

  mongoUri:
    process.env.NODE_ENV === 'test'
      ? process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/smart-user-db-test'
      : process.env.MONGO_URI,

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },

  corsOrigin: process.env.CORS_ORIGIN || '*',

  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_UPLOAD_MB, 10) || 5,
    path: process.env.UPLOAD_PATH || './uploads',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 2525,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'no-reply@smartuserapi.com',
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
};
