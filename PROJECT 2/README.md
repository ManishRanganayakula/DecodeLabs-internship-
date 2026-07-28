# Smart User Management REST API

A production-ready **Smart User Management REST API** built with Node.js, Express and MongoDB — developed for the **DecodeLabs Full Stack Development Internship (Project 2)**.

It goes beyond the minimum brief (CRUD + validation + error handling) and implements JWT authentication with refresh tokens, role-based access control, pagination/search/sort/filter, profile image uploads, rate limiting, audit logging, soft deletes, Swagger docs, a Jest/Supertest test suite, Docker, and a GitHub Actions CI/CD pipeline.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [Installation](#installation)
5. [Environment Variables](#environment-variables)
6. [Running Locally](#running-locally)
7. [Docker Setup](#docker-setup)
8. [API Documentation (Swagger)](#api-documentation-swagger)
9. [Postman Collection](#postman-collection)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Screenshots](#screenshots)
13. [Future Improvements](#future-improvements)
14. [License](#license)

---

## Features

**Core**
- REST API with full CRUD (`GET`, `POST`, `PUT`, `DELETE`)
- JWT authentication (access + refresh tokens, 24h expiry)
- Role-based authorization (`admin`, `user`) + self-or-admin ownership checks
- Centralized request validation (`express-validator`)
- Centralized error handling with a consistent response envelope
- 404 handler + async error wrapper (no repetitive try/catch in controllers)

**Security**
- Password hashing with `bcrypt` (configurable salt rounds)
- `helmet` security headers, `cors`, `hpp`, `express-mongo-sanitize`, `xss-clean`
- Rate limiting (global + a stricter limiter on auth endpoints)
- JWTs never expose the password hash; `toJSON` strips sensitive fields

**Advanced**
- Pagination, search, sorting and filtering on the users list
- Profile image upload via `multer`
- Soft delete (users are marked deleted, not removed) + audit logging
- Forgot/reset password and change-password flows
- Refresh token rotation
- Health check endpoint for uptime monitors/load balancers
- API versioning (`/api/v1/...`)
- Swagger/OpenAPI documentation
- Gzip compression, structured request logging (`morgan`)

**Quality & DevOps**
- MVC + service-layer architecture
- Jest + Supertest integration/unit tests (in-memory MongoDB, no external DB needed)
- ESLint (Airbnb base) + Prettier
- Multi-stage, non-root Dockerfile + `docker-compose.yml`
- GitHub Actions CI pipeline (lint → test → coverage → Docker build)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (`jsonwebtoken`), `bcrypt` |
| Validation | `express-validator` |
| Security | `helmet`, `cors`, `hpp`, `express-mongo-sanitize`, `xss-clean`, `express-rate-limit` |
| Uploads | `multer` (Cloudinary-ready) |
| Docs | `swagger-jsdoc`, `swagger-ui-express` |
| Testing | `jest`, `supertest`, `mongodb-memory-server` |
| Lint/Format | ESLint, Prettier |
| DevOps | Docker, Docker Compose, GitHub Actions |

---

## Folder Structure

```
backend/
├── src/
│   ├── config/          # env.js — centralized environment config
│   ├── controllers/     # auth, user, health controllers
│   ├── middleware/       # auth, role, validate, error handler, rate limiter, upload
│   ├── models/           # User.model.js, AuditLog.model.js
│   ├── routes/           # auth.routes.js, user.routes.js, health.routes.js, index.js
│   ├── services/         # auth.service.js, user.service.js, email.service.js, audit.service.js
│   ├── validators/       # auth.validator.js, user.validator.js
│   ├── utils/            # ApiResponse, ApiError, asyncHandler, logger, jwt
│   ├── docs/             # swagger.js
│   ├── constants/        # statusCodes.js, index.js (roles/messages)
│   ├── helpers/          # pagination.helper.js, queryBuilder.helper.js
│   ├── database/         # connection.js, seed.js
│   ├── app.js             # Express app + middleware stack
│   └── server.js          # Entry point, graceful shutdown
├── tests/
│   ├── setup.js
│   ├── unit/
│   └── integration/
├── uploads/
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── jest.config.js
├── postman_collection.json
├── package.json
└── README.md
```

---

## Installation

**Prerequisites:** Node.js ≥ 18, npm, and either a MongoDB Atlas connection string or a local MongoDB instance.

```bash
git clone <your-repo-url>
cd backend
npm install
cp .env.example .env
```

Then edit `.env` with your own values (see next section).

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Environment | `development` / `production` / `test` |
| `PORT` | Server port | `5000` |
| `API_VERSION` | API version prefix | `v1` |
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster0.mongodb.net/smart-user-db` |
| `MONGO_URI_TEST` | Mongo URI used when `NODE_ENV=test` | `mongodb://127.0.0.1:27017/smart-user-db-test` |
| `JWT_SECRET` | Secret for signing access tokens | long random string |
| `JWT_EXPIRES_IN` | Access token TTL | `24h` |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | long random string |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `BCRYPT_SALT_ROUNDS` | bcrypt cost factor | `12` |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window | `900000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `CORS_ORIGIN` | Allowed origin | `http://localhost:3000` |
| `MAX_FILE_UPLOAD_MB` | Max profile image size | `5` |
| `UPLOAD_PATH` | Local upload directory | `./uploads` |
| `CLOUDINARY_*` | Optional Cloudinary credentials | — |
| `SMTP_*`, `EMAIL_FROM` | Email credentials for password reset | — |
| `CLIENT_URL` | Frontend URL used to build reset/verify links | `http://localhost:3000` |

Never commit your real `.env` file — only `.env.example` is tracked in git.

---

## Running Locally

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production mode
npm start

# Seed the database with an admin + sample users
npm run seed
```

The API will be available at `http://localhost:5000`, with:
- Root info: `GET /`
- Health check: `GET /api/v1/health`
- Swagger docs: `http://localhost:5000/api-docs`

---

## Docker Setup

**Build and run with Docker Compose (API + MongoDB in one command):**

```bash
docker-compose up --build
```

This starts:
- `smart-user-api` on `http://localhost:5000`
- `smart-user-mongo` (MongoDB 7) on port `27017`, with a named volume for persistence

**Build the image standalone:**

```bash
docker build -t smart-user-management-api .
docker run -p 5000:5000 --env-file .env smart-user-management-api
```

The image uses a multi-stage build, runs as a non-root user, and ships with a container `HEALTHCHECK` hitting `/api/v1/health`.

---

## API Documentation (Swagger)

Interactive OpenAPI 3.0 documentation is generated from JSDoc comments in the route files and served at:

```
http://localhost:5000/api-docs
```

A raw JSON spec is also available at `http://localhost:5000/api-docs.json` if you want to import it elsewhere (e.g. Postman's "Import from OpenAPI").

---

## Postman Collection

A ready-to-import collection is included at [`postman_collection.json`](./postman_collection.json). It covers:

- Register, Login, Refresh Token, Get Me, Logout
- Forgot Password, Reset Password, Change Password
- Get All Users (with pagination/search/sort/filter query params), Get User By ID, Update User, Upload Profile Image, Delete User
- Health Check

It uses collection variables (`baseUrl`, `accessToken`, `refreshToken`, `userId`) and includes test scripts that auto-capture tokens from the Register/Login responses, so once you run those two requests the rest of the collection works out of the box.

**To use it:** Open Postman → Import → select `postman_collection.json` → set `baseUrl` if not running on `localhost:5000`.

---

## Testing

Tests run against an **in-memory MongoDB instance** (`mongodb-memory-server`), so no real database connection is needed to run the suite — including in CI.

```bash
# Run the full test suite
npm test

# Watch mode
npm run test:watch

# With coverage report (writes to ./coverage)
npm run test:coverage
```

Suite includes:
- **Unit tests** — `User` model: password hashing, comparison, soft delete, sensitive-field stripping, age validation
- **Integration tests** — auth flows (register/login/me, validation errors, duplicate email) and user CRUD (pagination, search, ownership rules, role escalation prevention, self-delete prevention)

---

## Deployment

### Render
1. Push your repo to GitHub.
2. Create a new **Web Service** on Render, connect the repo.
3. Build command: `npm install` — Start command: `npm start`.
4. Add all variables from `.env.example` under **Environment**.
5. Render auto-assigns `PORT`; the app already reads `process.env.PORT`.

### Railway
1. Create a new project → **Deploy from GitHub repo**.
2. Railway detects Node automatically; set the start command to `npm start` if not auto-detected.
3. Add environment variables in the **Variables** tab (mirror `.env.example`).
4. Optionally add a Railway-hosted MongoDB plugin, or keep using Atlas.

### Vercel
Vercel is primarily built for serverless/edge functions rather than long-running Express servers. To deploy this API there, wrap `src/app.js` as a serverless function (e.g. via `vercel.json` rewrites to an `api/index.js` that exports the Express app) — note that persistent features relying on long-lived processes (e.g. in-memory rate limiting across many instances) behave differently in a serverless environment. For a standard long-running Express deployment, Render/Railway/Docker are a more natural fit.

### Docker (any host: VPS, AWS ECS, DigitalOcean, etc.)
```bash
docker build -t smart-user-management-api .
docker run -d -p 5000:5000 --env-file .env --name smart-user-api smart-user-management-api
```

---

## Screenshots

> Add screenshots of Swagger UI, Postman runs, and sample responses here once you've run the project locally.

- `docs/screenshots/swagger-ui.png`
- `docs/screenshots/postman-register.png`
- `docs/screenshots/postman-login.png`

---

## Future Improvements

- Email verification enforcement (block login until `isEmailVerified`)
- Cloudinary integration for profile images (currently local disk storage)
- Redis-backed rate limiting and refresh-token store for multi-instance deployments
- GraphQL gateway alongside REST
- Full-text search via MongoDB Atlas Search
- Admin dashboard consuming this API
- OAuth2 / social login (Google, GitHub)
- Webhooks for user lifecycle events

---

## License

Licensed under the [MIT License](./LICENSE).
