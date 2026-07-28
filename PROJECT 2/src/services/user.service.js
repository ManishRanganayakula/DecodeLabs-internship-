const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const { getPagination, buildMeta } = require('../helpers/pagination.helper');
const { buildUserFilter, buildSort } = require('../helpers/queryBuilder.helper');
const { MESSAGES } = require('../constants');
const auditService = require('./audit.service');

/**
 * Fetches a paginated, searchable, sortable, filterable list of users.
 */
const listUsers = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = buildUserFilter(query);
  const sort = buildSort(query.sort);

  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return { users, meta: buildMeta({ page, limit, total }) };
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
  return user;
};

const updateUser = async (id, updates, actorId, meta = {}) => {
  // Prevent privilege escalation / unintended field updates via mass-assignment
  const allowedFields = ['name', 'email', 'age', 'phoneNumber', 'address', 'role', 'isActive', 'profileImage'];
  const sanitized = Object.keys(updates)
    .filter((key) => allowedFields.includes(key))
    .reduce((acc, key) => ({ ...acc, [key]: updates[key] }), {});

  const user = await User.findByIdAndUpdate(id, sanitized, {
    new: true,
    runValidators: true,
    context: 'query',
  });

  if (!user) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);

  await auditService.log({
    actor: actorId,
    action: 'UPDATE',
    resource: 'User',
    resourceId: user._id,
    metadata: { fields: Object.keys(sanitized) },
    ipAddress: meta.ip,
  });

  return user;
};

const deleteUser = async (id, actorId, meta = {}) => {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);

  await user.softDelete();

  await auditService.log({
    actor: actorId,
    action: 'SOFT_DELETE',
    resource: 'User',
    resourceId: user._id,
    ipAddress: meta.ip,
  });

  return user;
};

const updateProfileImage = async (id, imagePath) => {
  const user = await User.findByIdAndUpdate(id, { profileImage: imagePath }, { new: true });
  if (!user) throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
  return user;
};

module.exports = { listUsers, getUserById, updateUser, deleteUser, updateProfileImage };
