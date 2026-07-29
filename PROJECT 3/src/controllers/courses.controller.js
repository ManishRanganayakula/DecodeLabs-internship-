/**
 * courses.controller.js
 * ----------------------
 * CRUD for the `courses` resource, plus the reverse M:M view
 * (which students are enrolled in a given course).
 */

const db = require('../config/db');

function createCourse(req, res) {
  const { title, description, instructor, capacity } = req.body;
  if (!title || !instructor) {
    return res.status(400).json({ error: 'title and instructor are required.' });
  }

  const info = db
    .prepare(`INSERT INTO courses (title, description, instructor, capacity) VALUES (?, ?, ?, ?)`)
    .run(title, description || null, instructor, capacity || 30);

  const course = db.prepare(`SELECT * FROM courses WHERE id = ?`).get(info.lastInsertRowid);
  res.status(201).json(course);
}

function getCourses(req, res) {
  const courses = db.prepare(`SELECT * FROM courses ORDER BY id`).all();
  res.json({ count: courses.length, data: courses });
}

function getCourseById(req, res) {
  const course = db.prepare(`SELECT * FROM courses WHERE id = ?`).get(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  res.json(course);
}

function updateCourse(req, res) {
  const existing = db.prepare(`SELECT * FROM courses WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Course not found.' });

  const { title, description, instructor, capacity } = req.body;
  db.prepare(
    `UPDATE courses SET title = ?, description = ?, instructor = ?, capacity = ? WHERE id = ?`
  ).run(
    title ?? existing.title,
    description ?? existing.description,
    instructor ?? existing.instructor,
    capacity ?? existing.capacity,
    req.params.id
  );

  res.json(db.prepare(`SELECT * FROM courses WHERE id = ?`).get(req.params.id));
}

function deleteCourse(req, res) {
  const result = db.prepare(`DELETE FROM courses WHERE id = ?`).run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Course not found.' });
  res.status(204).send();
}

function getCourseStudents(req, res) {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, e.status, e.enrolled_at
       FROM enrollments e
       JOIN users u ON u.id = e.user_id
       WHERE e.course_id = ?
       ORDER BY e.enrolled_at DESC`
    )
    .all(req.params.id);

  res.json({ course_id: Number(req.params.id), count: rows.length, students: rows });
}

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseStudents,
};
