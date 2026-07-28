const request = require('supertest');
const app = require('../../src/app');

const validUser = {
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  password: 'Jane@1234',
  age: 25,
  phoneNumber: '+919876543210',
};

describe('Auth Endpoints', () => {
  describe('POST /api/v1/auth/register', () => {
    it('registers a new user successfully', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(validUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('rejects duplicate email registration', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const res = await request(app).post('/api/v1/auth/register').send(validUser);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects weak passwords', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'weak@example.com', password: 'weak' });

      expect(res.statusCode).toBe(422);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('rejects users under 18', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'minor@example.com', age: 15 });

      expect(res.statusCode).toBe(422);
    });

    it('rejects invalid phone numbers', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'phone@example.com', phoneNumber: '123' });

      expect(res.statusCode).toBe(422);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
    });

    it('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('rejects incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'WrongPass@1' });

      expect(res.statusCode).toBe(401);
    });

    it('rejects login for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nope@example.com', password: 'Whatever@1' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('rejects requests without a token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('returns the current user profile with a valid token', async () => {
      const registerRes = await request(app).post('/api/v1/auth/register').send(validUser);
      const { accessToken } = registerRes.body.data;

      const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.email).toBe(validUser.email);
    });
  });
});
