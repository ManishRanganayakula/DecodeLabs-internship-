const { body, param, query } = require('express-validator');
const { ROLES } = require('../constants');

const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

const mongoIdParam = (field = 'id') =>
  param(field).isMongoId().withMessage(`${field} must be a valid Mongo ObjectId`);

const updateUserValidator = [
  mongoIdParam('id'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('age').optional().isInt({ min: 18, max: 120 }).withMessage('Age must be a number and at least 18'),
  body('phoneNumber')
    .optional()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage('Please provide a valid phone number in E.164 format'),
  body('role').optional().isIn(Object.values(ROLES)).withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}`),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
  body('address.street').optional().trim().isLength({ max: 200 }),
  body('address.city').optional().trim().isLength({ max: 100 }),
  body('address.state').optional().trim().isLength({ max: 100 }),
  body('address.zipCode').optional().trim().isLength({ max: 20 }),
  body('address.country').optional().trim().isLength({ max: 100 }),
];

const getUserByIdValidator = [mongoIdParam('id')];
const deleteUserValidator = [mongoIdParam('id')];

const listUsersValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('role').optional().isIn(Object.values(ROLES)).withMessage(`role must be one of: ${Object.values(ROLES).join(', ')}`),
  query('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
  query('minAge').optional().isInt({ min: 0 }).withMessage('minAge must be a non-negative integer'),
  query('maxAge').optional().isInt({ min: 0 }).withMessage('maxAge must be a non-negative integer'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=]).{8,}$/)
    .withMessage(
      'New password must contain an uppercase letter, a lowercase letter, a number and a special character',
    ),
];

module.exports = {
  updateUserValidator,
  getUserByIdValidator,
  deleteUserValidator,
  listUsersValidator,
  changePasswordValidator,
};
