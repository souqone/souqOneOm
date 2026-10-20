import request from 'supertest';
import { createTestApp, closeTestApp, getApp, getPrisma, uniqueId, registerUser } from './setup';
import { AppleTokenVerifierService } from '../src/auth/apple-token-verifier.service';
import { AppleRevocationService } from '../src/auth/apple-revocation.service';
import { AuthService } from '../src/auth/auth.service';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

let appleVerifier: AppleTokenVerifierService;
let appleRevocation: AppleRevocationService;
let authService: AuthService;
let verifyIdTokenSpy: jest.SpyInstance;
let exchangeAndRevokeSpy: jest.SpyInstance;
let isRevocationConfiguredSpy: jest.SpyInstance;
let verifyGoogleTokenSpy: jest.SpyInstance;

beforeAll(async () => {
  await createTestApp({ useGlobalFilters: true });
  appleVerifier = getApp().get(AppleTokenVerifierService);
  appleRevocation = getApp().get(AppleRevocationService);
  authService = getApp().get(AuthService);
  verifyIdTokenSpy = jest.spyOn(appleVerifier, 'verifyIdToken');
  exchangeAndRevokeSpy = jest.spyOn(appleRevocation, 'exchangeAndRevoke');
  isRevocationConfiguredSpy = jest.spyOn(appleRevocation, 'isRevocationConfigured');
  verifyGoogleTokenSpy = jest.spyOn(authService, 'verifyGoogleIdToken');
});

afterAll(async () => {
  await closeTestApp();
});

beforeEach(() => {
  verifyIdTokenSpy.mockReset();
  exchangeAndRevokeSpy.mockReset();
  isRevocationConfiguredSpy.mockReset();
  isRevocationConfiguredSpy.mockReturnValue(true);
  verifyGoogleTokenSpy.mockReset();
});

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
        .expect(201);

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

  // ─── Account Deletion & Apple Re-authentication (PR2B) ───
  describe('POST /api/users/me/delete-account with Apple Re-authentication', () => {
    it('exposes availableDeletionReauthMethods and deletionReauthMethod on GET /api/users/me', async () => {
      const { accessToken, user } = await registerUser();
      const appleSub = `apple_sub_${uniqueId()}`;
      await getPrisma().user.update({
        where: { id: user.id },
        data: { appleSub },
      });

      const res = await request(getApp().getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.availableDeletionReauthMethods).toEqual(
        expect.arrayContaining(['password', 'apple']),
      );
      expect(res.body.deletionReauthMethod).toBe('password');
    });

    it('successfully schedules deletion for Apple-only account and calls verifyIdToken + exchangeAndRevoke', async () => {
      const { accessToken, user } = await registerUser();
      const appleSub = `apple_sub_${uniqueId()}`;
      await getPrisma().user.update({
        where: { id: user.id },
        data: { appleSub, passwordHash: null },
      });

      verifyIdTokenSpy.mockResolvedValueOnce({ sub: appleSub, email: user.email });
      exchangeAndRevokeSpy.mockResolvedValueOnce(undefined);

      const res = await request(getApp().getHttpServer())
        .post('/api/users/me/delete-account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          appleIdentityToken: 'mock.identity.token',
          appleNonce: 'mock-nonce',
          appleAuthorizationCode: 'mock-auth-code',
          confirmation: 'حذف حسابي',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.deletionScheduledAt).toBeDefined();
      expect(res.body.message).toBe('تمت جدولة حذف الحساب بنجاح');

      expect(verifyIdTokenSpy).toHaveBeenCalledWith('mock.identity.token', 'mock-nonce');
      expect(exchangeAndRevokeSpy).toHaveBeenCalledWith('mock-auth-code', appleSub);

      const dbUser = await getPrisma().user.findUnique({ where: { id: user.id } });
      expect(dbUser?.deletionScheduledAt).not.toBeNull();
    });

    it('handles duplicate deletion request: verifies Apple identity but skips exchangeAndRevoke and returns existing schedule', async () => {
      const { accessToken, user } = await registerUser();
      const appleSub = `apple_sub_${uniqueId()}`;
      const existingSchedule = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await getPrisma().user.update({
        where: { id: user.id },
        data: { appleSub, passwordHash: null, deletionScheduledAt: existingSchedule },
      });

      verifyIdTokenSpy.mockResolvedValueOnce({ sub: appleSub, email: user.email });

      const res = await request(getApp().getHttpServer())
        .post('/api/users/me/delete-account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          appleIdentityToken: 'mock.identity.token',
          appleNonce: 'mock-nonce',
          appleAuthorizationCode: 'mock-auth-code',
          confirmation: 'حذف حسابي',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('حسابك مجدول للحذف بالفعل');
      expect(verifyIdTokenSpy).toHaveBeenCalledWith('mock.identity.token', 'mock-nonce');
      expect(exchangeAndRevokeSpy).not.toHaveBeenCalled();
    });

    it('handles invalid_grant race condition: returns success if exchangeAndRevoke fails with APPLE_CODE_INVALID but user was already scheduled', async () => {
      const { accessToken, user } = await registerUser();
      const appleSub = `apple_sub_${uniqueId()}`;
      await getPrisma().user.update({
        where: { id: user.id },
        data: { appleSub, passwordHash: null },
      });

      verifyIdTokenSpy.mockResolvedValueOnce({ sub: appleSub, email: user.email });
      exchangeAndRevokeSpy.mockImplementationOnce(async () => {
        await getPrisma().user.update({
          where: { id: user.id },
          data: { deletionScheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        });
        throw new BadRequestException({
          statusCode: 400,
          code: 'APPLE_CODE_INVALID',
          message: 'رمز تفويض Apple غير صالح أو مستخدم بالفعل',
        });
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/users/me/delete-account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          appleIdentityToken: 'mock.identity.token',
          appleNonce: 'mock-nonce',
          appleAuthorizationCode: 'mock-auth-code',
          confirmation: 'حذف حسابي',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('حسابك مجدول للحذف بالفعل');
    });

    it('rejects with APPLE_SUB_MISMATCH (401) if identityToken sub does not match user.appleSub', async () => {
      const { accessToken, user } = await registerUser();
      const appleSub = `apple_sub_${uniqueId()}`;
      await getPrisma().user.update({
        where: { id: user.id },
        data: { appleSub, passwordHash: null },
      });

      verifyIdTokenSpy.mockResolvedValueOnce({ sub: 'different_apple_sub', email: user.email });

      const res = await request(getApp().getHttpServer())
        .post('/api/users/me/delete-account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          appleIdentityToken: 'mock.identity.token',
          appleNonce: 'mock-nonce',
          appleAuthorizationCode: 'mock-auth-code',
          confirmation: 'حذف حسابي',
        })
        .expect(401);

      expect(res.body.code).toBe('APPLE_SUB_MISMATCH');
      expect(exchangeAndRevokeSpy).not.toHaveBeenCalled();

      const dbUser = await getPrisma().user.findUnique({ where: { id: user.id } });
      expect(dbUser?.deletionScheduledAt).toBeNull();
    });

    it('rejects with APPLE_REVOCATION_UNAVAILABLE (503) if Apple revocation is unconfigured', async () => {
      const { accessToken, user } = await registerUser();
      const appleSub = `apple_sub_${uniqueId()}`;
      await getPrisma().user.update({
        where: { id: user.id },
        data: { appleSub, passwordHash: null },
      });

      isRevocationConfiguredSpy.mockReturnValue(false);
      verifyIdTokenSpy.mockResolvedValueOnce({ sub: appleSub, email: user.email });
      exchangeAndRevokeSpy.mockImplementationOnce((code: string, sub: string) =>
        AppleRevocationService.prototype.exchangeAndRevoke.call(appleRevocation, code, sub),
      );

      const res = await request(getApp().getHttpServer())
        .post('/api/users/me/delete-account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          appleIdentityToken: 'mock.identity.token',
          appleNonce: 'mock-nonce',
          appleAuthorizationCode: 'mock-auth-code',
          confirmation: 'حذف حسابي',
        })
        .expect(503);

      expect(res.body.code).toBe('APPLE_REVOCATION_UNAVAILABLE');

      const dbUser = await getPrisma().user.findUnique({ where: { id: user.id } });
      expect(dbUser?.deletionScheduledAt).toBeNull();
    });

    it('handles Apple service error (503): account remains active and deletionScheduledAt remains null', async () => {
      const { accessToken, user } = await registerUser();
      const appleSub = `apple_sub_${uniqueId()}`;
      await getPrisma().user.update({
        where: { id: user.id },
        data: { appleSub, passwordHash: null },
      });

      verifyIdTokenSpy.mockResolvedValueOnce({ sub: appleSub, email: user.email });
      exchangeAndRevokeSpy.mockRejectedValueOnce(
        new ServiceUnavailableException({
          statusCode: 503,
          code: 'APPLE_SERVICE_ERROR',
          message: 'تعذر الاتصال بخدمة Apple، يرجى المحاولة بعد قليل',
        }),
      );

      const res = await request(getApp().getHttpServer())
        .post('/api/users/me/delete-account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          appleIdentityToken: 'mock.identity.token',
          appleNonce: 'mock-nonce',
          appleAuthorizationCode: 'mock-auth-code',
          confirmation: 'حذف حسابي',
        })
        .expect(503);

      expect(res.body.code).toBe('APPLE_SERVICE_ERROR');

      const dbUser = await getPrisma().user.findUnique({ where: { id: user.id } });
      expect(dbUser?.deletionScheduledAt).toBeNull();
    });

    it('allows linked account (password + Apple) to delete using password without invoking Apple services', async () => {
      const password = 'StrongPassword123!';
      const { accessToken, user } = await registerUser({ password });
      const appleSub = `apple_sub_${uniqueId()}`;
      await getPrisma().user.update({
        where: { id: user.id },
        data: { appleSub },
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/users/me/delete-account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          password,
          confirmation: 'حذف حسابي',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(verifyIdTokenSpy).not.toHaveBeenCalled();
      expect(exchangeAndRevokeSpy).not.toHaveBeenCalled();

      const dbUser = await getPrisma().user.findUnique({ where: { id: user.id } });
      expect(dbUser?.deletionScheduledAt).not.toBeNull();
    });

    it('allows linked account (Google + Apple) to delete using Google token without invoking Apple services', async () => {
      const { accessToken, user } = await registerUser();
      const appleSub = `apple_sub_${uniqueId()}`;
      const googleId = `google_id_${uniqueId()}`;
      await getPrisma().user.update({
        where: { id: user.id },
        data: { appleSub, googleId, passwordHash: null },
      });

      verifyGoogleTokenSpy.mockResolvedValueOnce({ sub: googleId, email: user.email });

      const res = await request(getApp().getHttpServer())
        .post('/api/users/me/delete-account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          googleIdToken: 'mock.google.id.token',
          confirmation: 'حذف حسابي',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(verifyGoogleTokenSpy).toHaveBeenCalledWith('mock.google.id.token');
      expect(verifyIdTokenSpy).not.toHaveBeenCalled();
      expect(exchangeAndRevokeSpy).not.toHaveBeenCalled();

      const dbUser = await getPrisma().user.findUnique({ where: { id: user.id } });
      expect(dbUser?.deletionScheduledAt).not.toBeNull();
    });

    it('rejects Apple-only account attempting deletion without Apple credentials with APPLE_REAUTH_REQUIRED (401)', async () => {
      const { accessToken, user } = await registerUser();
      const appleSub = `apple_sub_${uniqueId()}`;
      await getPrisma().user.update({
        where: { id: user.id },
        data: { appleSub, passwordHash: null },
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/users/me/delete-account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          confirmation: 'حذف حسابي',
        })
        .expect(401);

      expect(res.body.code).toBe('APPLE_REAUTH_REQUIRED');
    });

    it('rejects partial Apple fields with 400 validation error', async () => {
      const { accessToken, user } = await registerUser();
      const appleSub = `apple_sub_${uniqueId()}`;
      await getPrisma().user.update({
        where: { id: user.id },
        data: { appleSub, passwordHash: null },
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/users/me/delete-account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          appleIdentityToken: 'mock.identity.token',
          confirmation: 'حذف حسابي',
        })
        .expect(400);

      expect(res.body.message).toContain('يلزم إرسال جميع بيانات Apple معاً');
    });
  });
});
