/**
 * Minimal leveled logger. In a larger production system this would be
 * swapped for winston/pino, but the interface below is kept identical
 * so that swap is a one-file change.
 */
const timestamp = () => new Date().toISOString();

const logger = {
  info: (msg) => console.log(`[INFO] ${timestamp()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${timestamp()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${timestamp()} - ${msg}`),
  debug: (msg) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${timestamp()} - ${msg}`);
    }
  },
};

module.exports = logger;
