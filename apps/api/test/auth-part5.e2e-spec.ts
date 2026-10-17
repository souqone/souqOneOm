import request from 'supertest';
import {
  createTestApp,
  closeTestApp,
  getApp,
  getPrisma,
  getMockMailService,
  uniqueId,
  registerUser,
} from './setup';
import { AccessTokenGate } from '../src/auth/access-token-gate.service';
import { AccountStatus } from '@prisma/client';

beforeAll(async () => {
  await createTestApp({ useGlobalFilters: true });
});

afterAll(async () => {
  await closeTestApp();
});

describe('Auth Part 5 E2E Tests (Live Docker Postgres 18 & TokenVersion Gate)', () => {
  describe('1. changePassword immediate token revocation', () => {
    it('invalidates old access token immediately (401) and new access token works (200)', async () => {
      const { accessToken: oldToken, user } = await registerUser();

      // Verify old token works before password change
      await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${oldToken}`)
        .expect(200);

      // Change password via PATCH /api/users/me/password
      const changeRes = await request(getApp().getHttpServer())
        .patch('/api/users/me/password')
        .set('Authorization', `Bearer ${oldToken}`)
        .send({
          currentPassword: 'TestPass123!',
          newPassword: 'BrandNewPassword123!',
        })
        .expect(200);

      const newToken = changeRes.body.accessToken;
      expect(newToken).toBeDefined();
      expect(newToken).not.toBe(oldToken);

      // Old token MUST now be rejected with 401
      await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${oldToken}`)
        .expect(401);

      // New token MUST succeed with 200
      const profileRes = await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(profileRes.body.id).toBe(user.id);
    });
  });

  describe('2. resetPassword immediate token revocation', () => {
    it('invalidates existing access token immediately after password reset', async () => {
      const email = `reset_${uniqueId()}@test.com`;
      const { accessToken } = await registerUser({ email, password: 'InitialPass123!' });

      // Token works before reset
      await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Request reset code
      await request(getApp().getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(201);

      const mailService = getMockMailService();
      const code = mailService.lastPasswordResetEmail?.code;
      expect(code).toBeDefined();

      // Execute reset password
      await request(getApp().getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          email,
          code,
          newPassword: 'AfterResetPass123!',
        })
        .expect(201);

      // Old token MUST now be rejected with 401
      await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  describe('3. revokeAllSessions immediate token revocation', () => {
    it('invalidates active access token immediately after calling revokeAllSessions', async () => {
      const { accessToken } = await registerUser();

      // Token works
      await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Revoke all sessions via POST /api/users/me/sessions/revoke-all
      await request(getApp().getHttpServer())
        .post('/api/users/me/sessions/revoke-all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      // Old token MUST now be rejected with 401
      await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  describe('4. BANNED status immediate rejection', () => {
    it('rejects access token with 401 when account status is BANNED', async () => {
      const prisma = getPrisma();
      const gate = getApp().get(AccessTokenGate);
      const { accessToken, user } = await registerUser();

      // Token works initially
      await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Ban the user in the database and invalidate gate cache
      await prisma.user.update({
        where: { id: user.id },
        data: { status: AccountStatus.BANNED },
      });
      await gate.invalidate(user.id);

      // Subsequent request MUST return 401
      await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  describe('5. Null Email Protection on forgot-password', () => {
    it('returns constant generic response without exception when email is null in DB', async () => {
      const prisma = getPrisma();
      const uid = uniqueId();

      // Create a user record with email = null and phone
      await prisma.user.create({
        data: {
          username: `phoneuser_${uid}`,
          email: null,
          phoneE164: '+9689' + uid.slice(0, 7),
          passwordHash: 'dummyhash',
          isVerified: true,
        },
      });

      // Call forgot-password with arbitrary email
      const res = await request(getApp().getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: `arbitrary_${uid}@example.com` })
        .expect(201);

      expect(res.body).toEqual({
        message: 'إذا كان البريد مسجلاً ستصلك رسالة',
      });
    });
  });

  describe('6. Report 116: ACCOUNT_SUSPENDED suspendedUntil passthrough and Refresh behavior', () => {
    it('POST /api/auth/login returns 403 with code ACCOUNT_SUSPENDED and exact ISO suspendedUntil', async () => {
      const prisma = getPrisma();
      const testEmail = `suspended_fixed_${uniqueId()}@example.test`;
      const testPassword = 'TestPassword123!';
      const futureSuspendedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const { user } = await registerUser({
        email: testEmail,
        password: testPassword,
      });

      // Suspend user with dynamic future date (now + 30 days)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: AccountStatus.SUSPENDED,
          suspendedUntil: futureSuspendedUntil,
        },
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(403);

      expect(res.body).toMatchObject({
        statusCode: 403,
        code: 'ACCOUNT_SUSPENDED',
        suspendedUntil: futureSuspendedUntil.toISOString(),
      });
      expect(res.body.timestamp).toBeDefined();
    });

    it('POST /api/auth/login returns 403 with code ACCOUNT_SUSPENDED and suspendedUntil: null when suspended indefinitely', async () => {
      const prisma = getPrisma();
      const testEmail = `suspended_null_${uniqueId()}@example.test`;
      const testPassword = 'TestPassword123!';

      const { user } = await registerUser({
        email: testEmail,
        password: testPassword,
      });

      // Suspend user with null suspendedUntil
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: AccountStatus.SUSPENDED,
          suspendedUntil: null,
        },
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(403);

      expect(res.body).toMatchObject({
        statusCode: 403,
        code: 'ACCOUNT_SUSPENDED',
        suspendedUntil: null,
      });
      expect(res.body.timestamp).toBeDefined();
    });

    it('POST /api/auth/refresh for suspended user returns 401 without code (per pre-existing rotateRefreshToken behavior)', async () => {
      const prisma = getPrisma();
      const testEmail = `suspended_rf_${uniqueId()}@example.test`;
      const testPassword = 'TestPassword123!';
      const refreshSuspendedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const { refreshToken, user } = await registerUser({
        email: testEmail,
        password: testPassword,
      });

      // Suspend user after obtaining valid refresh token with dynamic future date
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: AccountStatus.SUSPENDED,
          suspendedUntil: refreshSuspendedUntil,
        },
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(res.body.statusCode).toBe(401);
      // Confirms rotateRefreshToken returns null when status !== ACTIVE, throwing UnauthorizedException
      expect(res.body.code).toBeUndefined();
    });
  });
});
