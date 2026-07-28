const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const path = require('path');

const config = require('./config/env');
const routes = require('./routes');
const swaggerSpec = require('./docs/swagger');
const notFound = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const logger = require('./utils/logger');

const app = express();

// Trust proxy (needed on Render/Railway/behind load balancers for correct req.ip)
app.set('trust proxy', 1);

// ---------- Security middleware ----------
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(mongoSanitize()); // strips $ and . operators from req.body/query/params
app.use(xssClean()); // sanitizes user input against basic XSS

// ---------- Body parsing ----------
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(hpp()); // protects against HTTP parameter pollution

// ---------- Performance ----------
app.use(compression());

// ---------- Logging ----------
if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// ---------- Static file serving (uploaded profile images) ----------
app.use('/uploads', express.static(path.join(process.cwd(), config.upload.path)));

// ---------- Rate limiting (applied to all /api routes) ----------
app.use(`/api/${config.apiVersion}`, apiLimiter);

// ---------- Swagger API docs ----------
const swaggerUi = require('swagger-ui-express'); // eslint-disable-line global-require
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Smart User API Docs' }));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// ---------- Root ----------
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart User Management REST API is running',
    docs: '/api-docs',
    health: `/api/${config.apiVersion}/health`,
  });
});

// ---------- API routes ----------
app.use(`/api/${config.apiVersion}`, routes);

// ---------- 404 + central error handler ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
