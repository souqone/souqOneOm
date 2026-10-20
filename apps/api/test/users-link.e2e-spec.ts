import request from 'supertest';
import { createTestApp, closeTestApp, getApp, getPrisma, uniqueId, registerUser } from './setup';
import { AppleTokenVerifierService } from '../src/auth/apple-token-verifier.service';
import { AuthService } from '../src/auth/auth.service';
import { AuthTokenService } from '../src/auth/auth-token.service';
import { AuthProvider } from '@prisma/client';

let appleVerifier: AppleTokenVerifierService;
let authService: AuthService;
let verifyAppleSpy: jest.SpyInstance;
let verifyGoogleSpy: jest.SpyInstance;

beforeAll(async () => {
  await createTestApp({ useGlobalFilters: true });
  appleVerifier = getApp().get(AppleTokenVerifierService);
  authService = getApp().get(AuthService);
  verifyAppleSpy = jest.spyOn(appleVerifier, 'verifyIdToken');
  verifyGoogleSpy = jest.spyOn(authService, 'verifyGoogleIdToken');
});

afterAll(async () => {
  await closeTestApp();
});

beforeEach(() => {
  verifyAppleSpy.mockReset();
  verifyGoogleSpy.mockReset();
});

describe('Users Account Linking & Unlinking (e2e)', () => {
  const defaultPassword = 'TestPassword123!';

  describe('POST /api/users/me/link/google', () => {
    it('requires 403 STEP_UP_REQUIRED when currentPassword is missing for user with password', async () => {
      const { accessToken } = await registerUser({ password: defaultPassword });

      const res = await request(getApp().getHttpServer())
        .post('/api/users/me/link/google')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ credential: 'google-raw-token' })
        .expect(403);

      expect(res.body.code).toBe('STEP_UP_REQUIRED');
    });

    it('successfully links Google account with valid password and Google token', async () => {
      const { accessToken, user } = await registerUser({ password: defaultPassword });
      const googleSub = `google-sub-${uniqueId()}`;

      verifyGoogleSpy.mockResolvedValue({
        sub: googleSub,
        email: `google-${uniqueId()}@gmail.com`,
        email_verified: true,
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/users/me/link/google')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          credential: 'google-valid-token',
          currentPassword: defaultPassword,
        })
        .expect(201);

      expect(res.body.message).toBe('تم ربط حساب Google بنجاح');

      // Verify DB dual-write
      const prisma = getPrisma();
      const updated = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updated?.googleId).toBe(googleSub);

      const identity = await prisma.authIdentity.findUnique({
        where: {
          provider_providerUserId: {
            provider: AuthProvider.GOOGLE,
            providerUserId: googleSub,
          },
        },
      });
      expect(identity?.userId).toBe(user.id);
    });

    it('returns 200 OK idempotently when linking the same Google account again', async () => {
      const { accessToken } = await registerUser({ password: defaultPassword });
      const googleSub = `google-sub-${uniqueId()}`;

      verifyGoogleSpy.mockResolvedValue({
        sub: googleSub,
        email: `google-${uniqueId()}@gmail.com`,
        email_verified: true,
      });

      // First link
      await request(getApp().getHttpServer())
        .post('/api/users/me/link/google')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ credential: 'tok', currentPassword: defaultPassword })
        .expect(201);

      // Second link (same token sub)
      const res2 = await request(getApp().getHttpServer())
        .post('/api/users/me/link/google')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ credential: 'tok', currentPassword: defaultPassword })
        .expect(201);

      expect(res2.body.message).toBe('تم ربط حساب Google بنجاح');
    });

    it('rejects with 409 SOCIAL_ACCOUNT_ALREADY_LINKED if Google account is linked to another user', async () => {
      const googleSub = `shared-google-${uniqueId()}`;

      // User A links Google
      const userA = await registerUser({ password: defaultPassword });
      verifyGoogleSpy.mockResolvedValue({
        sub: googleSub,
        email: 'shared@gmail.com',
        email_verified: true,
      });

      await request(getApp().getHttpServer())
        .post('/api/users/me/link/google')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .send({ credential: 'tokA', currentPassword: defaultPassword })
        .expect(201);

      // User B attempts to link same Google
      const userB = await registerUser({ password: defaultPassword });
      const resB = await request(getApp().getHttpServer())
        .post('/api/users/me/link/google')
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .send({ credential: 'tokB', currentPassword: defaultPassword })
        .expect(409);

      expect(resB.body.code).toBe('SOCIAL_ACCOUNT_ALREADY_LINKED');
      expect(resB.body.message).toBe('حساب Google هذا مرتبط بحساب آخر بالفعل');
    });
  });

  describe('POST /api/users/me/link/apple', () => {
    it('validates that nonce is mandatory (400 Bad Request if missing)', async () => {
      const { accessToken } = await registerUser({ password: defaultPassword });

      await request(getApp().getHttpServer())
        .post('/api/users/me/link/apple')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          identityToken: 'apple-raw-token',
          currentPassword: defaultPassword,
        })
        .expect(400);
    });

    it('successfully links Apple account with valid nonce, password, and Apple token', async () => {
      const { accessToken, user } = await registerUser({ password: defaultPassword });
      const appleSub = `apple-sub-${uniqueId()}`;
      const nonce = `nonce-${uniqueId()}`;

      verifyAppleSpy.mockResolvedValue({
        sub: appleSub,
        email: `apple-${uniqueId()}@privaterelay.appleid.com`,
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/users/me/link/apple')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          identityToken: 'apple-token-123',
          nonce,
          currentPassword: defaultPassword,
        })
        .expect(201);

      expect(res.body.message).toBe('تم ربط حساب Apple بنجاح');

      const prisma = getPrisma();
      const updated = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updated?.appleSub).toBe(appleSub);

      const identity = await prisma.authIdentity.findUnique({
        where: {
          provider_providerUserId: {
            provider: AuthProvider.APPLE,
            providerUserId: appleSub,
          },
        },
      });
      expect(identity?.userId).toBe(user.id);
    });
  });

  describe('DELETE /api/users/me/link/google', () => {
    it('returns 200 OK idempotently when Google is not linked', async () => {
      const { accessToken } = await registerUser({ password: defaultPassword });

      const res = await request(getApp().getHttpServer())
        .delete('/api/users/me/link/google')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: defaultPassword })
        .expect(200);

      expect(res.body.message).toBe('حساب Google غير مرتبط بالفعل');
    });

    it('blocks unlinking with 400 LAST_LOGIN_METHOD if Google is the only login method', async () => {
      const prisma = getPrisma();
      const googleSub = `google-solo-${uniqueId()}`;
      const soloUser = await prisma.user.create({
        data: {
          email: `solo-${uniqueId()}@example.com`,
          username: `solo_${uniqueId()}`,
          displayName: 'Solo Google',
          googleId: googleSub,
          passwordHash: null,
          isVerified: true,
        },
      });

      // Login or generate access token for this solo user
      const authTokenService = getApp().get(AuthTokenService);
      const token = await authTokenService.signAccessToken(soloUser);

      verifyGoogleSpy.mockResolvedValue({
        sub: googleSub,
        email: soloUser.email,
        email_verified: true,
      });

      const res = await request(getApp().getHttpServer())
        .delete('/api/users/me/link/google')
        .set('Authorization', `Bearer ${token}`)
        .send({ reauthGoogleIdToken: 'valid-token' })
        .expect(400);

      expect(res.body.code).toBe('LAST_LOGIN_METHOD');
      expect(res.body.message).toBe(
        'لا يمكن إزالة وسيلة الدخول الأخيرة لحسابك. يرجى إضافة وسيلة دخول أخرى أولا.',
      );
    });

    it('unlinks Google successfully when user has password, rotates tokens, and invalidates old token', async () => {
      const { accessToken, user } = await registerUser({ password: defaultPassword });
      const googleSub = `google-to-remove-${uniqueId()}`;

      verifyGoogleSpy.mockResolvedValue({
        sub: googleSub,
        email: `google-${uniqueId()}@gmail.com`,
        email_verified: true,
      });

      // Link first
      await request(getApp().getHttpServer())
        .post('/api/users/me/link/google')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ credential: 'tok', currentPassword: defaultPassword })
        .expect(201);

      // Now unlink
      const res = await request(getApp().getHttpServer())
        .delete('/api/users/me/link/google')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: defaultPassword })
        .expect(200);

      expect(res.body.message).toBe('تم إلغاء ربط حساب Google بنجاح');
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();

      // Check DB: googleId is null and AuthIdentity is deleted
      const prisma = getPrisma();
      const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(freshUser?.googleId).toBeNull();

      const identity = await prisma.authIdentity.findUnique({
        where: {
          provider_providerUserId: {
            provider: AuthProvider.GOOGLE,
            providerUserId: googleSub,
          },
        },
      });
      expect(identity).toBeNull();

      // Old access token should be invalidated by AccessTokenGate
      await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      // New access token should work seamlessly
      const meRes = await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${res.body.accessToken}`)
        .expect(200);

      expect(meRes.body.email).toBe(user.email);
    });
  });

  describe('DELETE /api/users/me/link/apple', () => {
    it('returns 200 OK idempotently when Apple is not linked', async () => {
      const { accessToken } = await registerUser({ password: defaultPassword });

      const res = await request(getApp().getHttpServer())
        .delete('/api/users/me/link/apple')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: defaultPassword })
        .expect(200);

      expect(res.body.message).toBe('حساب Apple غير مرتبط بالفعل');
    });

    it('unlinks Apple successfully when user has password, rotates tokens, and invalidates old token', async () => {
      const { accessToken, user } = await registerUser({ password: defaultPassword });
      const appleSub = `apple-to-remove-${uniqueId()}`;
      const nonce = `nonce-${uniqueId()}`;

      verifyAppleSpy.mockResolvedValue({
        sub: appleSub,
        email: `apple-${uniqueId()}@privaterelay.appleid.com`,
      });

      // Link first
      await request(getApp().getHttpServer())
        .post('/api/users/me/link/apple')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ identityToken: 'apple-tok', nonce, currentPassword: defaultPassword })
        .expect(201);

      // Unlink
      const res = await request(getApp().getHttpServer())
        .delete('/api/users/me/link/apple')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: defaultPassword })
        .expect(200);

      expect(res.body.message).toBe('تم إلغاء ربط حساب Apple بنجاح');
      expect(res.body.accessToken).toBeDefined();

      const prisma = getPrisma();
      const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(freshUser?.appleSub).toBeNull();

      // Old token rejected
      await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      // New token accepted
      await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${res.body.accessToken}`)
        .expect(200);
    });
  });
});
