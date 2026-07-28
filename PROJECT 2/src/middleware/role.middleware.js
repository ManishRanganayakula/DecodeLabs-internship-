const ApiError = require('../utils/ApiError');
const { MESSAGES } = require('../constants');

/**
 * Restricts a route to one or more roles.
 * Usage: router.delete('/:id', protect, authorize('admin'), controller)
 */
const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized(MESSAGES.UNAUTHORIZED);
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(MESSAGES.FORBIDDEN);
    }
    next();
  };

/**
 * Allows the action if the requester is either an admin OR the owner of
 * the resource identified by req.params.id (e.g. a user editing their own
 * profile).
 */
const authorizeSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    throw ApiError.unauthorized(MESSAGES.UNAUTHORIZED);
  }
  const isOwner = req.user._id.toString() === req.params.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden(MESSAGES.FORBIDDEN);
  }
  next();
};

module.exports = { authorize, authorizeSelfOrAdmin };
