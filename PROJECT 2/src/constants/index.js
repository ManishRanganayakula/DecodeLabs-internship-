const ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
});

const MESSAGES = Object.freeze({
  REGISTER_SUCCESS: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  FETCH_SUCCESS: 'Data fetched successfully',
  UPDATE_SUCCESS: 'Data updated successfully',
  DELETE_SUCCESS: 'Data deleted successfully',
  VALIDATION_FAILED: 'Validation failed',
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'You are not authorized to access this resource',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'Resource not found',
  USER_NOT_FOUND: 'User not found',
  EMAIL_EXISTS: 'An account with this email already exists',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  TOKEN_EXPIRED: 'Session expired. Please log in again.',
  TOKEN_INVALID: 'Invalid authentication token',
  PASSWORD_RESET_SENT: 'Password reset instructions sent to email',
  PASSWORD_RESET_SUCCESS: 'Password has been reset successfully',
});

module.exports = { ROLES, MESSAGES };
