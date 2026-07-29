const express = require('express');
const router = express.Router();
const courses = require('../controllers/courses.controller');

router.post('/', courses.createCourse);
router.get('/', courses.getCourses);
router.get('/:id', courses.getCourseById);
router.put('/:id', courses.updateCourse);
router.delete('/:id', courses.deleteCourse);

router.get('/:id/students', courses.getCourseStudents); // M:M relation read

module.exports = router;
