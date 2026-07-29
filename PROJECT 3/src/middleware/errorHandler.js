/**
 * errorHandler.js
 * ---------------
 * Translates thrown errors (including SQLite constraint violations)
 * into clean, predictable HTTP responses instead of leaking stack
 * traces or raw driver errors to the client.
 */

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(`[ERROR] ${req.method} ${req.originalUrl} ->`, err.message);

  // better-sqlite3 surfaces constraint violations with these codes.
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'A record with that unique value already exists.' });
  }
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(409).json({ error: 'Referenced record does not exist.' });
  }
  if (err.code === 'SQLITE_CONSTRAINT_CHECK') {
    return res.status(400).json({ error: 'One or more fields violate a data validation rule.' });
  }
  if (err.code === 'SQLITE_CONSTRAINT_NOTNULL') {
    return res.status(400).json({ error: 'A required field is missing.' });
  }

  return res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
}

function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
}

module.exports = { errorHandler, notFound };
