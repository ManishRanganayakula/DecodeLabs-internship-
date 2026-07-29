/**
 * server.js
 * ---------
 * Entry point. Wires up middleware, mounts the resource routers,
 * and starts the HTTP server.
 */

require('dotenv').config();
const express = require('express');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

const usersRoutes = require('./src/routes/users.routes');
const coursesRoutes = require('./src/routes/courses.routes');
const enrollmentsRoutes = require('./src/routes/enrollments.routes');

const app = express();
app.use(express.json());

// Simple request log so behavior is observable during grading/demo.
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'campus-lms-api', timestamp: new Date().toISOString() });
});

app.use('/api/users', usersRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/enrollments', enrollmentsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

// Only auto-listen when run directly (keeps the app importable for tests).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Campus LMS API listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
