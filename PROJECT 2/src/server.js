const app = require('./app');
const config = require('./config/env');
const { connectDB } = require('./database/connection');
const logger = require('./utils/logger');

let server;

const start = async () => {
  await connectDB();

  server = app.listen(config.port, () => {
    logger.info(`Server running in ${config.env} mode on port ${config.port}`);
    logger.info(`Swagger docs available at http://localhost:${config.port}/api-docs`);
  });
};

start();

// ---------- Graceful shutdown & crash safety ----------
const shutdown = (signal) => {
  logger.warn(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.stack}`);
  process.exit(1);
});

module.exports = server;
