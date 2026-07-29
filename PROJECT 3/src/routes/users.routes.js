const express = require('express');
const router = express.Router();
const users = require('../controllers/users.controller');

router.post('/', users.createUser);            // CREATE  -> INSERT
router.get('/', users.getUsers);                // READ    -> SELECT (all)
router.get('/:id', users.getUserById);          // READ    -> SELECT (one)
router.put('/:id', users.updateUser);           // UPDATE  -> UPDATE
router.delete('/:id', users.deleteUser);        // DELETE  -> DELETE

router.get('/:id/profile', users.getProfile);   // 1:1 relation read
router.put('/:id/profile', users.upsertProfile); // 1:1 relation upsert

router.get('/:id/courses', users.getUserCourses); // M:M relation read

module.exports = router;
