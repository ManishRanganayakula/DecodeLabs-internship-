/**
 * api.test.js
 * -----------
 * Lightweight smoke test (no external test framework required) that
 * boots the app in-process and exercises the full CRUD surface plus
 * the relationship endpoints. Run with: npm test
 *
 * Uses an isolated in-memory database so it never touches your real
 * campus.sqlite3 file.
 */

process.env.DB_PATH = ':memory:';

const http = require('http');
const app = require('../server');

function request(server, method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: server.address().port,
        path,
        method,
        headers: data
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
          : {},
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed = null;
          try { parsed = raw ? JSON.parse(raw) : null; } catch (_) { parsed = raw; }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  ✅ ${message}`);
  } else {
    failed += 1;
    console.error(`  ❌ ${message}`);
  }
}

async function run() {
  const server = app.listen(0);
  console.log('Running smoke tests against in-memory database...\n');

  // --- Users CRUD ---------------------------------------------------
  let res = await request(server, 'POST', '/api/users', {
    name: 'Test User', email: 'test@example.com', age: 22,
  });
  assert(res.status === 201, 'POST /api/users creates a user (201)');
  const userId = res.body.id;

  res = await request(server, 'GET', `/api/users/${userId}`);
  assert(res.status === 200 && res.body.email === 'test@example.com', 'GET /api/users/:id reads it back');

  res = await request(server, 'PUT', `/api/users/${userId}`, { age: 23 });
  assert(res.status === 200 && res.body.age === 23, 'PUT /api/users/:id updates a field');

  // --- Uniqueness constraint -----------------------------------------
  res = await request(server, 'POST', '/api/users', {
    name: 'Dup', email: 'test@example.com', age: 30,
  });
  assert(res.status === 409, 'Duplicate email is rejected by UNIQUE constraint (409)');

  // --- 1:1 profile -----------------------------------------------------
  res = await request(server, 'PUT', `/api/users/${userId}/profile`, { bio: 'Hello world' });
  assert(res.status === 200 && res.body.bio === 'Hello world', 'PUT profile creates/updates 1:1 profile');

  // --- Courses CRUD ---------------------------------------------------
  res = await request(server, 'POST', '/api/courses', {
    title: 'Test Course', instructor: 'Prof. Test',
  });
  assert(res.status === 201, 'POST /api/courses creates a course (201)');
  const courseId = res.body.id;

  // --- M:M enrollment ---------------------------------------------------
  res = await request(server, 'POST', '/api/enrollments', { user_id: userId, course_id: courseId });
  assert(res.status === 201, 'POST /api/enrollments links a user and a course');

  res = await request(server, 'GET', `/api/users/${userId}/courses`);
  assert(res.status === 200 && res.body.count === 1, "GET /api/users/:id/courses reflects the enrollment");

  res = await request(server, 'GET', `/api/courses/${courseId}/students`);
  assert(res.status === 200 && res.body.count === 1, "GET /api/courses/:id/students reflects the enrollment");

  // --- Injection-style payload is treated as inert data -----------------
  res = await request(server, 'POST', '/api/users', {
    name: "Robert'); DROP TABLE users;--", email: 'safe@example.com', age: 20,
  });
  assert(res.status === 201, 'Injection-style string is stored safely as plain data, not executed');

  res = await request(server, 'GET', '/api/users');
  assert(res.status === 200 && res.body.count >= 3, 'users table still intact after injection-style input');

  // --- Delete ---------------------------------------------------------
  res = await request(server, 'DELETE', `/api/users/${userId}`);
  assert(res.status === 204, 'DELETE /api/users/:id removes the user (204)');

  res = await request(server, 'GET', `/api/users/${userId}`);
  assert(res.status === 404, 'Deleted user is no longer retrievable (404)');

  server.close();
  console.log(`\n${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
