/**
 * Wraps an async Express route handler and forwards any rejected promise
 * to Express's `next`, so controllers never need repetitive try/catch
 * blocks around await calls.
 *
 * Usage: router.get('/', asyncHandler(async (req, res) => {...}))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
