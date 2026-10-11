import request from 'supertest';
import { createTestApp, closeTestApp, getApp, getPrisma, uniqueId, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

describe('Auth API (e2e)', () => {
  // ─── Signup ───
  describe('POST /api/auth/signup', () => {
    it('should register a new user and return verification gate response without tokens', async () => {
      const uid = uniqueId();
      const res = await request(getApp().getHttpServer())
        .post('/api/auth/signup')
        .send({ email: `signup_${uid}@test.com`, username: `signup_${uid}`, password: 'Test1234!' })
        .expect(201);

      expect(res.body.requiresVerification).toBe(true);
      expect(res.body.verificationToken).toBeDefined();
      expect(res.body.emailSent).toBe(true);
      expect(res.body.accessToken).toBeUndefined();
      expect(res.body.refreshToken).toBeUndefined();
      expect(res.body.user.email).toBe(`signup_${uid}@test.com`);
    });

    it('should reject duplicate email', async () => {
      const uid = uniqueId();
      const email = `dup_${uid}@test.com`;
      await request(getApp().getHttpServer())
        .post('/api/auth/signup')
        .send({ email, username: `dup1_${uid}`, password: 'Test1234!' })
        .expect(201);

      await request(getApp().getHttpServer())
        .post('/api/auth/signup')
        .send({ email, username: `dup2_${uid}`, password: 'Test1234!' })
        .expect(400);
    });

    it('should reject invalid email format', async () => {
      await request(getApp().getHttpServer())
        .post('/api/auth/signup')
        .send({ email: 'not-an-email', username: `bad_${uniqueId()}`, password: 'Test1234!' })
        .expect(400);
    });
  });

  // ─── Login & Verification Gate ───
  describe('POST /api/auth/login & /api/auth/verify-email (Verification Gate)', () => {
    let testEmail: string;
    let verificationToken: string;
    const testPassword = 'LoginPass123!';

    beforeAll(async () => {
      const uid = uniqueId();
      testEmail = `login_${uid}@test.com`;
      const signupRes = await request(getApp().getHttpServer())
        .post('/api/auth/signup')
        .send({ email: testEmail, username: `login_${uid}`, password: testPassword })
        .expect(201);
      verificationToken = signupRes.body.verificationToken;
    });

    it('should return verification gate response without tokens for unverified account on correct password', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect(200);

      expect(res.body.requiresVerification).toBe(true);
      expect(res.body.verificationToken).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.accessToken).toBeUndefined();
      expect(res.body.refreshToken).toBeUndefined();
    });

    it('should reject unverified account with wrong password with 401', async () => {
      await request(getApp().getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'WrongPass!' })
        .expect(401);
    });

    it('should reject non-existent email with 401', async () => {
      await request(getApp().getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'Test1234!' })
        .expect(401);
    });

    it('should verify email with verification token and code from test DB and return session tokens', async () => {
      const user = await getPrisma().user.findUnique({
        where: { email: testEmail.toLowerCase() },
      });
      expect(user).toBeDefined();
      expect(user!.emailVerificationCode).toBeDefined();

      const res = await request(getApp().getHttpServer())
        .post('/api/auth/verify-email')
        .set('Authorization', `Bearer ${verificationToken}`)
        .send({ code: user!.emailVerificationCode })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.isVerified).toBe(true);
    });

    it('should login and return session tokens with verified: true in JWT payload after verification', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.isVerified).toBe(true);

      const payload = JSON.parse(
        Buffer.from(res.body.accessToken.split('.')[1], 'base64').toString('utf8'),
      );
      expect(payload.verified).toBe(true);
    });

    it('should return alreadyVerified without tokens when verify-email is called for already verified user', async () => {
      const res = await request(getApp().getHttpServer())
        .post('/api/auth/verify-email')
        .set('Authorization', `Bearer ${verificationToken}`)
        .send({ code: '123456' })
        .expect(200);

      expect(res.body.alreadyVerified).toBe(true);
      expect(res.body.message).toBe('البريد موثق بالفعل. يرجى تسجيل الدخول.');
      expect(res.body.accessToken).toBeUndefined();
      expect(res.body.refreshToken).toBeUndefined();
    });
  });

  // ─── Me ───
  describe('GET /api/users/me', () => {
    it('should return current user with valid token', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBeDefined();
    });

    it('should reject request without token', async () => {
      await request(getApp().getHttpServer())
        .get('/api/users/me')
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);
    });
  });

  // ─── Refresh ───
  describe('POST /api/auth/refresh', () => {
    it('should return new tokens with valid refresh token', async () => {
      const { refreshToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      await request(getApp().getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);
    });

    it('should reject already-used refresh token', async () => {
      const { refreshToken } = await registerUser();
      // Use it once
      await request(getApp().getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(201);
      // Try again — should fail (token rotated/revoked)
      await request(getApp().getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  // ─── Logout ───
  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const { refreshToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(201);

      expect(res.body.message).toBeDefined();
    });

    it('should invalidate refresh token after logout', async () => {
      const { refreshToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(201);

      await request(getApp().getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('should not fail on invalid refresh token logout', async () => {
      await request(getApp().getHttpServer())
        .post('/api/auth/logout')
        .send({ refreshToken: 'non-existent-token' })
        .expect(201);
    });
  });
});
