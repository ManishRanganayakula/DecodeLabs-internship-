const AuditLog = require('../models/AuditLog.model');
const logger = require('../utils/logger');

/**
 * Writes an audit log entry. Failures here must never break the primary
 * request flow, so errors are caught and logged rather than thrown.
 */
const log = async ({ actor, action, resource, resourceId, metadata = {}, ipAddress }) => {
  try {
    await AuditLog.create({ actor, action, resource, resourceId, metadata, ipAddress });
  } catch (error) {
    logger.error(`Failed to write audit log: ${error.message}`);
  }
};

module.exports = { log };
