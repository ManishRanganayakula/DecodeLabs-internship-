const mongoose = require('mongoose');
const config = require('../config/env');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

/**
 * Connect to MongoDB Atlas (or local Mongo for tests).
 * Retries a fixed number of times before giving up, since Atlas
 * connections can occasionally be slow to establish on cold starts.
 */
const connectDB = async (retries = 5, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const conn = await mongoose.connect(config.mongoUri, {
        autoIndex: config.env !== 'production',
      });
      logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempt} failed: ${error.message}`);
      if (attempt === retries) {
        logger.error('All MongoDB connection attempts failed. Exiting process.');
        process.exit(1);
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

const disconnectDB = async () => {
  await mongoose.connection.close();
};

module.exports = { connectDB, disconnectDB, mongoose };
