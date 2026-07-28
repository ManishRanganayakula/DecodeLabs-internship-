/**
 * Normalizes pagination query params and builds a `meta` object describing
 * the current page, so controllers/tests don't repeat this math.
 *
 * @param {object} query - req.query
 * @param {object} defaults
 */
const getPagination = (query, defaults = { page: 1, limit: 10, maxLimit: 100 }) => {
  let page = parseInt(query.page, 10) || defaults.page;
  let limit = parseInt(query.limit, 10) || defaults.limit;

  if (page < 1) page = 1;
  if (limit < 1) limit = defaults.limit;
  if (limit > defaults.maxLimit) limit = defaults.maxLimit;

  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildMeta = ({ page, limit, total }) => ({
  page,
  limit,
  totalItems: total,
  totalPages: Math.ceil(total / limit) || 1,
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

module.exports = { getPagination, buildMeta };
