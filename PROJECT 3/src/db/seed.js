/**
 * seed.js
 * -------
 * Populates the database with sample data so the API can be demoed
 * immediately after cloning. Safe to re-run (uses INSERT OR IGNORE
 * on unique columns where relevant).
 */

require('dotenv').config();
const db = require('../config/db');

const insertUser = db.prepare(
  `INSERT OR IGNORE INTO users (name, email, age, role) VALUES (?, ?, ?, ?)`
);
const insertProfile = db.prepare(
  `INSERT OR IGNORE INTO user_profiles (user_id, bio, avatar_url) VALUES (?, ?, ?)`
);
const insertCourse = db.prepare(
  `INSERT OR IGNORE INTO courses (title, description, instructor, capacity) VALUES (?, ?, ?, ?)`
);
const insertEnrollment = db.prepare(
  `INSERT OR IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)`
);

const seed = db.transaction(() => {
  insertUser.run('Alice Rao', 'alice@example.com', 21, 'student');
  insertUser.run('Ben Carter', 'ben@example.com', 24, 'student');
  insertUser.run('Dr. Priya Nair', 'priya@example.com', 38, 'instructor');

  insertProfile.run(1, 'Aspiring backend engineer.', null);
  insertProfile.run(2, 'Loves databases and coffee.', null);
  insertProfile.run(3, 'Teaches distributed systems.', null);

  insertCourse.run('Database Integration 101', 'Schemas, CRUD, and REST mapping.', 'Dr. Priya Nair', 25);
  insertCourse.run('Advanced SQL Security', 'Injection defense and query hardening.', 'Dr. Priya Nair', 20);

  insertEnrollment.run(1, 1);
  insertEnrollment.run(2, 1);
  insertEnrollment.run(1, 2);
});

seed();
console.log('✅ Database seeded with sample users, profiles, courses, and enrollments.');
