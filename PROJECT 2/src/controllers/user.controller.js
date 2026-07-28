const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const userService = require('../services/user.service');
const statusCodes = require('../constants/statusCodes');
const { MESSAGES } = require('../constants');

/**
 * @desc    Get all users (paginated, searchable, sortable, filterable)
 * @route   GET /api/v1/users
 * @access  Private (admin)
 */
const getUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await userService.listUsers(req.query);
  new ApiResponse(statusCodes.OK, MESSAGES.FETCH_SUCCESS, { users }, meta).send(res, statusCodes.OK);
});

/**
 * @desc    Get a single user by ID
 * @route   GET /api/v1/users/:id
 * @access  Private (self or admin)
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  new ApiResponse(statusCodes.OK, MESSAGES.FETCH_SUCCESS, { user }).send(res, statusCodes.OK);
});

/**
 * @desc    Update a user by ID
 * @route   PUT /api/v1/users/:id
 * @access  Private (self or admin)
 */
const updateUser = asyncHandler(async (req, res) => {
  // Non-admins may not change role or isActive on themselves
  if (req.user.role !== 'admin') {
    delete req.body.role;
    delete req.body.isActive;
  }

  const user = await userService.updateUser(req.params.id, req.body, req.user._id, { ip: req.ip });
  new ApiResponse(statusCodes.OK, MESSAGES.UPDATE_SUCCESS, { user }).send(res, statusCodes.OK);
});

/**
 * @desc    Soft-delete a user by ID
 * @route   DELETE /api/v1/users/:id
 * @access  Private (admin)
 */
const deleteUser = asyncHandler(async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    throw ApiError.badRequest('You cannot delete your own account');
  }
  await userService.deleteUser(req.params.id, req.user._id, { ip: req.ip });
  new ApiResponse(statusCodes.NO_CONTENT, MESSAGES.DELETE_SUCCESS, {}).send(res, statusCodes.NO_CONTENT);
});

/**
 * @desc    Upload/replace the current user's profile image
 * @route   POST /api/v1/users/:id/profile-image
 * @access  Private (self or admin)
 */
const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Please provide an image file');
  }
  const imagePath = `/uploads/${req.file.filename}`;
  const user = await userService.updateProfileImage(req.params.id, imagePath);
  new ApiResponse(statusCodes.OK, 'Profile image uploaded successfully', { user }).send(res, statusCodes.OK);
});

module.exports = { getUsers, getUserById, updateUser, deleteUser, uploadProfileImage };
