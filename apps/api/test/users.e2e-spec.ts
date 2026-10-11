import request from 'supertest';
import { createTestApp, closeTestApp, getApp, uniqueId, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

describe('Users API (e2e)', () => {
  // ─── Get Profile ───
  describe('GET /api/users/me', () => {
    it('should return user profile', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.email).toBeDefined();
      expect(res.body.username).toBeDefined();
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .get('/api/users/me')
        .expect(401);
    });

    it('should not expose passwordHash', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).not.toHaveProperty('passwordHash');
    });
  });

  // ─── Update Profile ───
  describe('PATCH /api/users/me', () => {
    it('should update display name', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ displayName: 'Updated Name' })
        .expect(200);

      expect(res.body.displayName).toBe('Updated Name');
    });

    it('should update phone number', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: '+96899887766' })
        .expect(200);

      expect(res.body.phone).toBe('+96899887766');
    });

    it('should reject unknown fields', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ role: 'ADMIN' })
        .expect(400);
    });
  });

  // ─── Change Password ───
  describe('PATCH /api/users/me/password', () => {
    it('should change password with correct old password', async () => {
      const uid = uniqueId();
      const email = `chpw_${uid}@test.com`;
      const oldPass = 'OldPass123!';
      const { accessToken } = await registerUser({ email, password: oldPass });

      await request(getApp().getHttpServer())
        .patch('/api/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: oldPass, newPassword: 'NewPass456!' })
        .expect(200);

      // Verify new password works
      const login = await request(getApp().getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'NewPass456!' })
        .expect(200);

      expect(login.body.accessToken).toBeDefined();
    });

    it('should reject wrong current password', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .patch('/api/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'WrongPass!', newPassword: 'NewPass456!' })
        .expect(400);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .patch('/api/users/me/password')
        .send({ currentPassword: 'Old', newPassword: 'New123!' })
        .expect(401);
    });
  });

  // ─── Public Profile ───
  describe('GET /api/users/:id', () => {
    it('should return public profile', async () => {
      const { user } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .get(`/api/users/${user.id}`)
        .expect(200);

      expect(res.body.username).toBeDefined();
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('should 404 for non-existent user', async () => {
      await request(getApp().getHttpServer())
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should not expose email in public profile', async () => {
      const { user } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .get(`/api/users/${user.id}`)
        .expect(200);

      expect(res.body).not.toHaveProperty('passwordHash');
    });
  });
});
