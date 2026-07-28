const crypto = require('crypto');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { MESSAGES } = require('../constants');
const auditService = require('./audit.service');

const buildTokenPayload = (user) => ({ id: user._id.toString(), role: user.role });

const issueTokens = (user) => ({
  accessToken: generateAccessToken(buildTokenPayload(user)),
  refreshToken: generateRefreshToken(buildTokenPayload(user)),
});

const register = async (payload, meta = {}) => {
  const existing = await User.findOne({ email: payload.email });
  if (existing) {
    throw ApiError.conflict(MESSAGES.EMAIL_EXISTS, [{ field: 'email', message: MESSAGES.EMAIL_EXISTS }]);
  }

  const user = await User.create(payload);
  const tokens = issueTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  await auditService.log({
    actor: user._id,
    action: 'CREATE',
    resource: 'User',
    resourceId: user._id,
    ipAddress: meta.ip,
  });

  return { user, ...tokens };
};

const login = async (email, password, meta = {}) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized(MESSAGES.INVALID_CREDENTIALS);
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Contact an administrator.');
  }

  const tokens = issueTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  await auditService.log({
    actor: user._id,
    action: 'LOGIN',
    resource: 'User',
    resourceId: user._id,
    ipAddress: meta.ip,
  });

  return { user, ...tokens };
};

const refreshAccessToken = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    throw ApiError.unauthorized('Refresh token is no longer valid');
  }

  const tokens = issueTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  return tokens;
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  // Do not reveal whether the email exists — always respond the same way.
  if (!user) return null;

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  return { user, resetToken };
};

const resetPassword = async (rawToken, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw ApiError.badRequest('Password reset token is invalid or has expired');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = undefined; // force re-login everywhere
  await user.save();

  await auditService.log({ actor: user._id, action: 'PASSWORD_RESET', resource: 'User', resourceId: user._id });

  return user;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  return user;
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
};
