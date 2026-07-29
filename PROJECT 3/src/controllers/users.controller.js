/**
 * users.controller.js
 * --------------------
 * CRUD for the `users` resource, plus the 1:1 `user_profiles` join
 * and the derived 1:Many/M:M view of a user's enrolled courses.
 *
 * SECURITY NOTE: every query below uses `?` placeholders with values
 * passed separately to `.run()` / `.get()` / `.all()`. better-sqlite3
 * binds these as data, never as executable SQL, which is the exact
 * "parameterized query" defense shown in the training deck — the raw
 * input can never break out of the value position, so classic
 * injection payloads like `' OR 1=1 --` are inert here.
 */

const db = require('../config/db');

// CREATE -----------------------------------------------------------------
function createUser(req, res) {
  const { name, email, age, role } = req.body;

  if (!name || !email || age === undefined) {
    return res.status(400).json({ error: 'name, email, and age are required.' });
  }

  const stmt = db.prepare(
    `INSERT INTO users (name, email, age, role) VALUES (?, ?, ?, ?)`
  );
  const info = stmt.run(name, email, age, role || 'student');

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(info.lastInsertRowid);
  res.status(201).json(user);
}

// READ (all, with pagination) --------------------------------------------
function getUsers(req, res) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = parseInt(req.query.offset, 10) || 0;

  const users = db
    .prepare(`SELECT * FROM users ORDER BY id LIMIT ? OFFSET ?`)
    .all(limit, offset);

  res.json({ count: users.length, limit, offset, data: users });
}

// READ (single) ------------------------------------------------------------
function getUserById(req, res) {
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json(user);
}

// UPDATE -------------------------------------------------------------------
function updateUser(req, res) {
  const { name, email, age, role } = req.body;
  const existing = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found.' });

  const stmt = db.prepare(
    `UPDATE users SET name = ?, email = ?, age = ?, role = ? WHERE id = ?`
  );
  stmt.run(
    name ?? existing.name,
    email ?? existing.email,
    age ?? existing.age,
    role ?? existing.role,
    req.params.id
  );

  const updated = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id);
  res.json(updated);
}

// DELETE ---------------------------------------------------------------
function deleteUser(req, res) {
  const result = db.prepare(`DELETE FROM users WHERE id = ?`).run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found.' });
  res.status(204).send();
}

// 1:1 relationship — profile ------------------------------------------------
function upsertProfile(req, res) {
  const { bio, avatar_url } = req.body;
  const userId = req.params.id;

  const user = db.prepare(`SELECT id FROM users WHERE id = ?`).get(userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  db.prepare(
    `INSERT INTO user_profiles (user_id, bio, avatar_url)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET bio = excluded.bio, avatar_url = excluded.avatar_url`
  ).run(userId, bio || null, avatar_url || null);

  const profile = db.prepare(`SELECT * FROM user_profiles WHERE user_id = ?`).get(userId);
  res.json(profile);
}

function getProfile(req, res) {
  const profile = db
    .prepare(`SELECT * FROM user_profiles WHERE user_id = ?`)
    .get(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found for this user.' });
  res.json(profile);
}

// M:M relationship — courses a user is enrolled in --------------------------
function getUserCourses(req, res) {
  const rows = db
    .prepare(
      `SELECT c.id, c.title, c.description, c.instructor, e.status, e.enrolled_at
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.user_id = ?
       ORDER BY e.enrolled_at DESC`
    )
    .all(req.params.id);

  res.json({ user_id: Number(req.params.id), count: rows.length, courses: rows });
}

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  upsertProfile,
  getProfile,
  getUserCourses,
};
