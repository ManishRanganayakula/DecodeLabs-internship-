-- =====================================================================
-- Campus LMS Schema
-- Demonstrates: Primary/Foreign keys, 1:1, 1:Many and Many:Many relations,
-- and column-level integrity constraints (UNIQUE, NOT NULL, CHECK).
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- USERS  (parent table)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE,
    age        INTEGER NOT NULL CHECK (age >= 13),
    role       TEXT    NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------
-- USER_PROFILES  (1 : 1 with users)
-- Each user owns exactly one profile row -> enforced with UNIQUE FK.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL UNIQUE,
    bio        TEXT,
    avatar_url TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- COURSES  (parent table)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    description TEXT,
    instructor  TEXT    NOT NULL,
    capacity    INTEGER NOT NULL DEFAULT 30 CHECK (capacity > 0),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------
-- ENROLLMENTS  (junction table -> Many : Many between users and courses)
-- A given user cannot enroll in the same course twice (composite UNIQUE).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    course_id    INTEGER NOT NULL,
    enrolled_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    status       TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
    FOREIGN KEY (user_id)   REFERENCES users (id)   ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user   ON enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments (course_id);
