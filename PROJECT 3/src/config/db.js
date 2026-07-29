/**
 * db.js
 * -----
 * The "bridge" between application code and permanent storage.
 *
 * We use better-sqlite3, a synchronous NATIVE DRIVER (not an ORM), so that
 * every query written in the routes/ layer is visible, explicit SQL.
 * This keeps the persistence layer transparent for a training project,
 * while still enforcing the same safety rules a production ORM would:
 * every value is bound as a parameter, never concatenated into the string.
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'db', 'campus.sqlite3');
const SCHEMA_PATH = path.join(__dirname, '..', 'db', 'schema.sql');

const db = new Database(DB_PATH);

// Enforce referential integrity at the connection level (SQLite disables
// this by default per-connection, so it must be turned on explicitly).
db.pragma('foreign_keys = ON');

// Apply schema idempotently on boot so a fresh clone "just works".
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

module.exports = db;
