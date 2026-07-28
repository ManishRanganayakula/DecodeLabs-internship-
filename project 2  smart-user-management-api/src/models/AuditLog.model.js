const mongoose = require('mongoose');

/**
 * Lightweight audit trail: records who did what, to which resource, and when.
 * Used for the bonus "Audit Logs" feature — written by services on
 * create/update/delete/login events.
 */
const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      required: true,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_RESET', 'SOFT_DELETE'],
    },
    resource: { type: String, required: true }, // e.g. "User"
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
  },
  { timestamps: true },
);

auditLogSchema.index({ actor: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
