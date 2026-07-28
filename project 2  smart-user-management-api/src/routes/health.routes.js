const express = require('express');
const { healthCheck } = require('../controllers/health.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Service health check
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/', healthCheck);

module.exports = router;
