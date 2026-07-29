/**
 * enrollments.controller.js
 * --------------------------
 * CRUD for the `enrollments` junction table itself — the resource
 * that turns users <-> courses into a proper Many-to-Many relationship.
 */

const db = require('../config/db');

function createEnrollment(req, res) {
  const { user_id, course_id } = req.body;
  if (!user_id || !course_id) {
    return res.status(400).json({ error: 'user_id and course_id are required.' });
  }

  const info = db
    .prepare(`INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)`)
    .run(user_id, course_id);

  const enrollment = db.prepare(`SELECT * FROM enrollments WHERE id = ?`).get(info.lastInsertRowid);
  res.status(201).json(enrollment);
}

function getEnrollments(req, res) {
  const enrollments = db.prepare(`SELECT * FROM enrollments ORDER BY id`).all();
  res.json({ count: enrollments.length, data: enrollments });
}

function getEnrollmentById(req, res) {
  const enrollment = db.prepare(`SELECT * FROM enrollments WHERE id = ?`).get(req.params.id);
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found.' });
  res.json(enrollment);
}

function updateEnrollmentStatus(req, res) {
  const { status } = req.body;
  const existing = db.prepare(`SELECT * FROM enrollments WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Enrollment not found.' });

  db.prepare(`UPDATE enrollments SET status = ? WHERE id = ?`).run(
    status ?? existing.status,
    req.params.id
  );

  res.json(db.prepare(`SELECT * FROM enrollments WHERE id = ?`).get(req.params.id));
}

function deleteEnrollment(req, res) {
  const result = db.prepare(`DELETE FROM enrollments WHERE id = ?`).run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Enrollment not found.' });
  res.status(204).send();
}

module.exports = {
  createEnrollment,
  getEnrollments,
  getEnrollmentById,
  updateEnrollmentStatus,
  deleteEnrollment,
};
