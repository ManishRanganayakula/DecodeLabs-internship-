const express = require('express');
const userController = require('../controllers/user.controller');
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { authorize, authorizeSelfOrAdmin } = require('../middleware/role.middleware');
const { uploadProfileImage } = require('../middleware/upload.middleware');
const { ROLES } = require('../constants');
const {
  updateUserValidator,
  getUserByIdValidator,
  deleteUserValidator,
  listUsersValidator,
} = require('../validators/user.validator');

const router = express.Router();

// All routes below require authentication
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (paginated, searchable, sortable, filterable)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema: { type: string }
 *         description: e.g. "-createdAt,name"
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, user] }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: minAge
 *         schema: { type: integer }
 *       - in: query
 *         name: maxAge
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated list of users
 */
router.get('/', authorize(ROLES.ADMIN), listUsersValidator, validate, userController.getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
router.get('/:id', getUserByIdValidator, validate, authorizeSelfOrAdmin, userController.getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput'
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 */
router.put('/:id', updateUserValidator, validate, authorizeSelfOrAdmin, userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Soft-delete a user by ID (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete('/:id', deleteUserValidator, validate, authorize(ROLES.ADMIN), userController.deleteUser);

/**
 * @swagger
 * /users/{id}/profile-image:
 *   post:
 *     summary: Upload a profile image for a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image uploaded
 */
router.post(
  '/:id/profile-image',
  getUserByIdValidator,
  validate,
  authorizeSelfOrAdmin,
  uploadProfileImage,
  userController.uploadProfileImage,
);

module.exports = router;
