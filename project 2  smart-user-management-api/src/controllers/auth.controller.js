const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const authService = require('../services/auth.service');
const emailService = require('../services/email.service');
const statusCodes = require('../constants/statusCodes');
const { MESSAGES } = require('../constants');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body, { ip: req.ip });

  new ApiResponse(statusCodes.CREATED, MESSAGES.REGISTER_SUCCESS, {
    user,
    accessToken,
    refreshToken,
  }).send(res, statusCodes.CREATED);
});

/**
 * @desc    Login an existing user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(email, password, { ip: req.ip });

  new ApiResponse(statusCodes.OK, MESSAGES.LOGIN_SUCCESS, { user, accessToken, refreshToken }).send(
    res,
    statusCodes.OK,
  );
});

/**
 * @desc    Exchange a valid refresh token for a new access/refresh token pair
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public (requires valid refresh token in body)
 */
const refreshToken = asyncHandler(async (req, res) => {
  const tokens = await authService.refreshAccessToken(req.body.refreshToken);
  new ApiResponse(statusCodes.OK, 'Token refreshed successfully', tokens).send(res, statusCodes.OK);
});

/**
 * @desc    Logout current user (invalidate refresh token)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  new ApiResponse(statusCodes.OK, MESSAGES.LOGOUT_SUCCESS, {}).send(res, statusCodes.OK);
});

/**
 * @desc    Get currently authenticated user's profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  new ApiResponse(statusCodes.OK, MESSAGES.FETCH_SUCCESS, { user: req.user }).send(res, statusCodes.OK);
});

/**
 * @desc    Request a password reset link via email
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  if (result) {
    await emailService.sendPasswordResetEmail(result.user, result.resetToken);
  }
  // Always return the same generic message to avoid leaking which emails exist
  new ApiResponse(statusCodes.OK, MESSAGES.PASSWORD_RESET_SENT, {}).send(res, statusCodes.OK);
});

/**
 * @desc    Reset password using a valid reset token
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  new ApiResponse(statusCodes.OK, MESSAGES.PASSWORD_RESET_SUCCESS, {}).send(res, statusCodes.OK);
});

/**
 * @desc    Change password while authenticated
 * @route   PATCH /api/v1/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user._id, currentPassword, newPassword);
  new ApiResponse(statusCodes.OK, 'Password changed successfully', {}).send(res, statusCodes.OK);
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
};
