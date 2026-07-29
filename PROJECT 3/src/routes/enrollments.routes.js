const express = require('express');
const router = express.Router();
const enrollments = require('../controllers/enrollments.controller');

router.post('/', enrollments.createEnrollment);
router.get('/', enrollments.getEnrollments);
router.get('/:id', enrollments.getEnrollmentById);
router.put('/:id', enrollments.updateEnrollmentStatus);
router.delete('/:id', enrollments.deleteEnrollment);

module.exports = router;
