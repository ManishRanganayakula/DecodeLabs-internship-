const mongoose = require('mongoose');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const statusCodes = require('../constants/statusCodes');

const MONGO_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/**
 * @desc    Health check endpoint for uptime monitors / load balancers
 * @route   GET /api/v1/health
 * @access  Public
 */
const healthCheck = asyncHandler(async (req, res) => {
  const dbState = MONGO_STATES[mongoose.connection.readyState] || 'unknown';

  new ApiResponse(statusCodes.OK, 'Service is healthy', {
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: dbState,
    environment: process.env.NODE_ENV || 'development',
  }).send(res, statusCodes.OK);
});

module.exports = { healthCheck };
