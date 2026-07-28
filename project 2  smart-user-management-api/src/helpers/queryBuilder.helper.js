/**
 * Builds a Mongo filter object from query params for the "search" feature
 * (case-insensitive partial match across name/email) plus optional exact
 * filters (role, isActive, minAge, maxAge).
 */
const buildUserFilter = (query) => {
  const filter = {};

  if (query.search) {
    const regex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  if (query.role) filter.role = query.role;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';

  if (query.minAge || query.maxAge) {
    filter.age = {};
    if (query.minAge) filter.age.$gte = parseInt(query.minAge, 10);
    if (query.maxAge) filter.age.$lte = parseInt(query.maxAge, 10);
  }

  return filter;
};

/**
 * Converts a `sort` query param like "-createdAt,name" into a Mongoose
 * sort object: { createdAt: -1, name: 1 }.
 */
const buildSort = (sortParam, defaultSort = { createdAt: -1 }) => {
  if (!sortParam) return defaultSort;

  return sortParam.split(',').reduce((acc, field) => {
    const trimmed = field.trim();
    if (trimmed.startsWith('-')) {
      acc[trimmed.substring(1)] = -1;
    } else if (trimmed) {
      acc[trimmed] = 1;
    }
    return acc;
  }, {});
};

module.exports = { buildUserFilter, buildSort };
