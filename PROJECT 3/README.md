# Campus LMS API — Project 3: Database Integration

**DecodeLabs Full Stack Development — Industrial Training Kit, Batch 2026**
Milestone: *Database Integration* — schema design, CRUD operations, and reliable
data handling that bridges application logic and permanent storage.

---

## 1. Overview

This project is a RESTful backend for a small course-enrollment platform. It
was built specifically to satisfy the four pillars called out in the
Project 3 brief:

| Pillar | Brief requirement | Where it lives in this repo |
|---|---|---|
| **1. The Blueprint** | Design a database schema | [`src/db/schema.sql`](src/db/schema.sql) |
| **2. The Bridge** | Connect the backend to the database | [`src/config/db.js`](src/config/db.js) |
| **3. The Action** | Perform CRUD via RESTful HTTP | `src/routes/*`, `src/controllers/*` |
| **4. The Shield** | Enforce integrity & block injection | schema `CHECK`/`UNIQUE`/`NOT NULL` + parameterized queries |

Rather than a toy "todo list," the domain models all three relationship
types called out in the training material so the schema actually exercises
relational design, not just a single flat table:

- **One-to-One** — `users` ↔ `user_profiles`
- **One-to-Many** — `courses` → `enrollments`
- **Many-to-Many** — `users` ↔ `courses`, resolved through the `enrollments`
  junction table

## 2. Architecture

```
Client (curl / Postman / frontend)
        │  HTTP (JSON)
        ▼
   Express routers  ──►  Controllers  ──►  better-sqlite3 (native driver)
   (REST mapping)        (business logic)   (parameterized SQL)  ──► campus.sqlite3
```

**Why a native driver instead of an ORM (e.g. Prisma/Sequelize)?**
The brief explicitly frames this milestone as "pure architectural logic,"
so the SQL is written by hand and kept fully visible in the controllers —
nothing is hidden behind a query builder. The trade-off, covered in the
deck (*Evaluating Native Drivers Against ORMs*), is more boilerplate in
exchange for maximum transparency and execution speed. Swapping in an ORM
later would only mean replacing `src/config/db.js` and the query calls
inside the controllers — the routes and HTTP contract stay identical.

## 3. Entity-Relationship Diagram

```
┌────────────┐        1:1        ┌──────────────────┐
│   users    │───────────────────│  user_profiles    │
│------------│                   │-------------------│
│ id (PK)    │                   │ id (PK)           │
│ name       │                   │ user_id (FK, UQ)  │
│ email (UQ) │                   │ bio               │
│ age        │                   │ avatar_url        │
│ role       │                   └──────────────────┘
└─────┬──────┘
      │ 1
      │
      │ M                         ┌────────────┐
      ▼                           │  courses   │
┌──────────────┐        M         │------------│
│ enrollments  │──────────────────│ id (PK)    │
│--------------│                  │ title      │
│ id (PK)      │                  │ instructor │
│ user_id (FK) │                  │ capacity   │
│ course_id(FK)│                  └────────────┘
│ status       │
│ UNIQUE(user_id, course_id)
└──────────────┘
```

`enrollments` is the junction table that turns the `users` ↔ `courses`
relationship into a proper Many-to-Many — exactly the pattern from the
*Structuring Data Through Relational Geometry* slide (Students ↔ Courses
via Enrollments).

## 4. Integrity rules enforced at the schema level

Per the deck's principle that *"the database must never trust application
logic blindly,"* validation is not left to the controller layer alone:

| Constraint | Applied to | Effect |
|---|---|---|
| `UNIQUE` | `users.email`, `user_profiles.user_id`, `(enrollments.user_id, enrollments.course_id)` | No duplicate accounts, no double profiles, no duplicate enrollments |
| `NOT NULL` | `name`, `email`, `age`, `title`, `instructor`, etc. | Required fields can never be silently empty |
| `CHECK` | `users.age >= 13`, `courses.capacity > 0`, `role IN (...)`, `status IN (...)` | Only logically valid values are ever stored |
| `FOREIGN KEY ... ON DELETE CASCADE` | `user_profiles.user_id`, `enrollments.user_id/course_id` | Deleting a user or course cleans up dependent rows automatically |

## 5. SQL injection defense

Every single query in `src/controllers/*` uses `?` placeholders with values
passed as a separate array to better-sqlite3 — never string concatenation:

```js
// Safe — the exact pattern from "Neutralizing Attacks with Parameterized Queries"
db.prepare(`SELECT * FROM users WHERE email = ?`).get(userInput);

// Never done in this codebase:
// db.prepare(`SELECT * FROM users WHERE email = '${userInput}'`);
```

Because the input is bound as a *value*, not spliced into the SQL text, a
payload like `' OR 1=1 --` is stored/compared as a literal string and can
never change the shape of the query. `tests/api.test.js` includes an
explicit test that inserts an injection-style string and confirms the table
is unaffected.

## 6. Tech stack

- **Runtime:** Node.js ≥ 18
- **Web framework:** Express 4
- **Database:** SQLite via `better-sqlite3` (synchronous native driver,
  zero external server required — ideal for local grading/demo)
- **Config:** `dotenv`

## 7. Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. (Optional) seed sample data — 3 users, 2 courses, 3 enrollments
npm run seed

# 4. Start the server
npm start
# → 🚀 Campus LMS API listening on http://localhost:4000
```

The schema is applied automatically on boot (`db.js` runs `schema.sql`
idempotently), so a fresh clone works with zero manual setup.

### Running the test suite

```bash
npm test
```

This boots the app against an isolated **in-memory** database and runs a
smoke test across every CRUD endpoint and relationship, including the
duplicate-email conflict and the injection-safety check.

## 8. API reference

Base URL: `http://localhost:4000/api`

### Users

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/users` | Create a user |
| `GET` | `/users?limit=&offset=` | List users (paginated) |
| `GET` | `/users/:id` | Get one user |
| `PUT` | `/users/:id` | Update a user |
| `DELETE` | `/users/:id` | Delete a user |
| `GET` | `/users/:id/profile` | Get the user's 1:1 profile |
| `PUT` | `/users/:id/profile` | Create/update the user's 1:1 profile |
| `GET` | `/users/:id/courses` | List courses this user is enrolled in (M:M) |

**Example**

```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Rao","email":"alice@example.com","age":21}'
```

### Courses

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/courses` | Create a course |
| `GET` | `/courses` | List all courses |
| `GET` | `/courses/:id` | Get one course |
| `PUT` | `/courses/:id` | Update a course |
| `DELETE` | `/courses/:id` | Delete a course |
| `GET` | `/courses/:id/students` | List students enrolled in this course (M:M) |

### Enrollments (junction resource)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/enrollments` | Enroll a user in a course (`user_id`, `course_id`) |
| `GET` | `/enrollments` | List all enrollments |
| `GET` | `/enrollments/:id` | Get one enrollment |
| `PUT` | `/enrollments/:id` | Update status (`active`/`completed`/`dropped`) |
| `DELETE` | `/enrollments/:id` | Remove an enrollment |

### CRUD → REST → SQL mapping used throughout

| Operation | HTTP verb | SQL statement |
|---|---|---|
| Create | `POST` | `INSERT` |
| Read | `GET` | `SELECT` |
| Update | `PUT` | `UPDATE` |
| Delete | `DELETE` | `DELETE` |

## 9. Error handling

All errors funnel through `src/middleware/errorHandler.js`, which maps raw
SQLite constraint codes to meaningful HTTP responses instead of leaking
driver internals:

| Constraint violated | HTTP status |
|---|---|
| `UNIQUE` | `409 Conflict` |
| `FOREIGN KEY` | `409 Conflict` |
| `CHECK` | `400 Bad Request` |
| `NOT NULL` | `400 Bad Request` |
| Unhandled | `500 Internal Server Error` |

## 10. Project structure

```
project3-db-integration/
├── server.js                     # App entry point, route mounting
├── package.json
├── .env.example
├── src/
│   ├── config/
│   │   └── db.js                 # Native-driver connection (Pillar 2: Bridge)
│   ├── db/
│   │   ├── schema.sql            # Schema + constraints (Pillar 1: Blueprint)
│   │   └── seed.js               # Sample data loader
│   ├── controllers/
│   │   ├── users.controller.js
│   │   ├── courses.controller.js
│   │   └── enrollments.controller.js
│   ├── routes/
│   │   ├── users.routes.js       # Pillar 3: Action (REST mapping)
│   │   ├── courses.routes.js
│   │   └── enrollments.routes.js
│   └── middleware/
│       └── errorHandler.js       # Pillar 4: Shield (safe error responses)
└── tests/
    └── api.test.js                # Smoke tests, incl. injection-safety check
```

## 11. Design notes / possible extensions

- Swap `better-sqlite3` for `pg` + PostgreSQL by rewriting `db.js` alone —
  the controller/route layers are storage-agnostic in shape.
- Add JWT-based auth and a `role`-based authorization middleware (the
  `users.role` column is already modeled for this).
- Add request validation with a library like `zod` for stricter input
  contracts ahead of the database layer.
- Add composite indexes if query patterns grow beyond the two already
  defined on `enrollments`.

## 12. Author

Built as Project 3 of the DecodeLabs Full Stack Development Industrial
Training Kit (Batch 2026).

📞 +91 89330 06408 · ✉️ decodelabs.tech@gmail.com · 🌐 www.decodelabs.tech
