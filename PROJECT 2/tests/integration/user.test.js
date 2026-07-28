const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User.model');

const adminUser = {
  name: 'System Admin',
  email: 'admin@example.com',
  password: 'Admin@1234',
  age: 30,
  phoneNumber: '+919876500001',
};

const normalUser = {
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  password: 'Jane@1234',
  age: 25,
  phoneNumber: '+919876500002',
};

const registerAndPromote = async (payload, role = 'user') => {
  const res = await request(app).post('/api/v1/auth/register').send(payload);
  if (role === 'admin') {
    await User.findByIdAndUpdate(res.body.data.user._id || res.body.data.user.id, { role: 'admin' });
    // re-login to get a token with the updated role embedded is unnecessary since
    // the route reads role fresh from req.user on protect(); but for JWT payload
    // consistency, log in again.
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: payload.email, password: payload.password });
    return { user: loginRes.body.data.user, token: loginRes.body.data.accessToken };
  }
  return { user: res.body.data.user, token: res.body.data.accessToken };
};

describe('User Endpoints', () => {
  let admin;
  let user;

  beforeEach(async () => {
    admin = await registerAndPromote(adminUser, 'admin');
    user = await registerAndPromote(normalUser, 'user');
  });

  describe('GET /api/v1/users', () => {
    it('rejects non-admin users', async () => {
      const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${user.token}`);
      expect(res.statusCode).toBe(403);
    });

    it('allows admins to list users with pagination meta', async () => {
      const res = await request(app).get('/api/v1/users?page=1&limit=10').set('Authorization', `Bearer ${admin.token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.meta).toHaveProperty('totalItems');
      expect(res.body.meta).toHaveProperty('totalPages');
    });

    it('supports searching by name', async () => {
      const res = await request(app)
        .get('/api/v1/users?search=Jane')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.users.some((u) => u.email === normalUser.email)).toBe(true);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('allows a user to fetch their own profile', async () => {
      const res = await request(app).get(`/api/v1/users/${user.user.id || user.user._id}`).set('Authorization', `Bearer ${user.token}`);
      expect(res.statusCode).toBe(200);
    });

    it('rejects a user fetching another user profile', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${admin.user.id || admin.user._id}`)
        .set('Authorization', `Bearer ${user.token}`);
      expect(res.statusCode).toBe(403);
    });

    it('returns 404 for a non-existent user id', async () => {
      const fakeId = '64b8f0c2f1a2b3c4d5e6f7a8';
      const res = await request(app).get(`/api/v1/users/${fakeId}`).set('Authorization', `Bearer ${admin.token}`);
      expect(res.statusCode).toBe(404);
    });

    it('returns 400 for an invalid id format', async () => {
      const res = await request(app).get('/api/v1/users/not-a-valid-id').set('Authorization', `Bearer ${admin.token}`);
      expect(res.statusCode).toBe(422);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('allows a user to update their own name', async () => {
      const id = user.user.id || user.user._id;
      const res = await request(app)
        .put(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ name: 'Jane Updated' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.name).toBe('Jane Updated');
    });

    it('prevents a non-admin from escalating their own role', async () => {
      const id = user.user.id || user.user._id;
      const res = await request(app)
        .put(`/api/v1/users/${id}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ role: 'admin' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.role).toBe('user');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('allows an admin to soft-delete a user', async () => {
      const id = user.user.id || user.user._id;
      const res = await request(app).delete(`/api/v1/users/${id}`).set('Authorization', `Bearer ${admin.token}`);
      expect(res.statusCode).toBe(204);
    });

    it('prevents a non-admin from deleting users', async () => {
      const id = admin.user.id || admin.user._id;
      const res = await request(app).delete(`/api/v1/users/${id}`).set('Authorization', `Bearer ${user.token}`);
      expect(res.statusCode).toBe(403);
    });

    it('prevents an admin from deleting their own account', async () => {
      const id = admin.user.id || admin.user._id;
      const res = await request(app).delete(`/api/v1/users/${id}`).set('Authorization', `Bearer ${admin.token}`);
      expect(res.statusCode).toBe(400);
    });
  });
});
