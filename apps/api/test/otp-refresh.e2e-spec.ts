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
import { OtpService } from '../src/auth/otp.service';
import { OtpPurpose } from '@prisma/client';

beforeAll(async () => {
  await createTestApp();
});

afterAll(async () => {
  await closeTestApp();
});

describe('OTP & Refresh Token Security Live Suite (E2E & Concurrency)', () => {
  /* ═══════════════════════════════════════════════════════════════
   * (A) Real Concurrency: 20 parallel verify calls on same valid code
   * ═══════════════════════════════════════════════════════════════ */
  describe('(A) Real Concurrency: 20 parallel verify calls on same valid code', () => {
    it('exactly 1 verify call returns OK, and all other 19 calls return non-OK', async () => {
      const prisma = getPrisma();
      const otpService = getApp().get(OtpService);

      const uid = uniqueId();
      const user = await prisma.user.create({
        data: {
          email: `concur_${uid}@test.com`,
          username: `concur_${uid}`,
          passwordHash: 'dummyhash',
        },
      });

      const rawCode = await otpService.issue(user.id, OtpPurpose.EMAIL_VERIFY, 900);
      expect(rawCode).toHaveLength(6);

      // Fire 20 parallel verify calls with the same correct rawCode
      const results = await Promise.all(
        Array.from({ length: 20 }, () =>
          otpService.verify(user.id, OtpPurpose.EMAIL_VERIFY, rawCode),
        ),
      );

      const okCount = results.filter((r) => r === 'OK').length;
      const nonOkCount = results.filter((r) => r !== 'OK').length;

      expect(okCount).toBe(1);
      expect(nonOkCount).toBe(19);

      // Every non-OK result must be a recognized security status
      for (const res of results) {
        expect(['OK', 'INVALID', 'TOO_MANY_ATTEMPTS', 'MISSING_OR_EXPIRED']).toContain(res);
      }
    });
  });

  /* ═══════════════════════════════════════════════════════════════
   * (B) Full HTTP: signup then verify-email with valid code
   * ═══════════════════════════════════════════════════════════════ */
  describe('(B) Full HTTP: signup then verify-email with valid code', () => {
    it('returns tokens and verified account upon correct email verification', async () => {
      const uid = uniqueId();
      const email = `signup_verify_${uid}@test.com`;
      const password = 'TestPass123!';
      const mailService = getMockMailService();

      // 1. Signup
      const signupRes = await request(getApp().getHttpServer())
        .post('/api/auth/signup')
        .send({ email, username: `signup_v_${uid}`, password })
        .expect(201);

      expect(signupRes.body.requiresVerification).toBe(true);
      expect(signupRes.body.verificationToken).toBeDefined();

      // 2. Code captured cleanly from MailService spy
      const code = mailService.verificationEmails.get(email.toLowerCase());
      expect(code).toBeDefined();
      expect(code).toHaveLength(6);

      // 3. Verify email via HTTP
      const verifyRes = await request(getApp().getHttpServer())
        .post('/api/auth/verify-email')
        .set('Authorization', `Bearer ${signupRes.body.verificationToken}`)
        .send({ code })
        .expect(200);

      expect(verifyRes.body.accessToken).toBeDefined();
      expect(verifyRes.body.refreshToken).toBeDefined();
      expect(verifyRes.body.user.isVerified).toBe(true);
      expect(verifyRes.body.user.email).toBe(email);
    });
  });

  /* ═══════════════════════════════════════════════════════════════
   * (C) Full HTTP: forgot-password then reset-password with valid code
   * ═══════════════════════════════════════════════════════════════ */
  describe('(C) Full HTTP: forgot-password then reset-password with valid code', () => {
    it('resets password, revokes old refresh tokens, and permits login with new password', async () => {
      const uid = uniqueId();
      const email = `forgot_reset_${uid}@test.com`;
      const oldPassword = 'OldPassword123!';
      const newPassword = 'NewPassword456!';
      const mailService = getMockMailService();

      // 1. Create verified user
      const signupRes = await request(getApp().getHttpServer())
        .post('/api/auth/signup')
        .send({ email, username: `f_r_${uid}`, password: oldPassword })
        .expect(201);

      const signupCode = mailService.verificationEmails.get(email.toLowerCase());
      const verifyRes = await request(getApp().getHttpServer())
        .post('/api/auth/verify-email')
        .set('Authorization', `Bearer ${signupRes.body.verificationToken}`)
        .send({ code: signupCode })
        .expect(200);

      const oldRefreshToken = verifyRes.body.refreshToken;

      // 2. Forgot password
      await request(getApp().getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(201);

      const resetCode = mailService.passwordResetEmails.get(email.toLowerCase());
      expect(resetCode).toBeDefined();
      expect(resetCode).toHaveLength(6);

      // 3. Reset password with correct code
      const resetRes = await request(getApp().getHttpServer())
        .post('/api/auth/reset-password')
        .send({ email, code: resetCode, newPassword })
        .expect(201);

      expect(resetRes.body.message).toContain('تغيير كلمة المرور بنجاح');

      // 4. Old refresh token is revoked
      await request(getApp().getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(401);

      // 5. Old password rejected
      await request(getApp().getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: oldPassword })
        .expect(401);

      // 6. New password accepted
      const loginRes = await request(getApp().getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: newPassword })
        .expect(201);

      expect(loginRes.body.accessToken).toBeDefined();
      expect(loginRes.body.refreshToken).toBeDefined();
    });
  });

  /* ═══════════════════════════════════════════════════════════════
   * (D) 5 wrong codes on reset-password lock challenge
   * ═══════════════════════════════════════════════════════════════ */
  describe('(D) 5 wrong codes on reset-password lock challenge', () => {
    it('rejects with "تم تجاوز عدد المحاولات. اطلب رمزاً جديداً." when 5 wrong attempts are made then correct code tried', async () => {
      const uid = uniqueId();
      const email = `lockout_reset_${uid}@test.com`;
      const password = 'Password123!';
      const mailService = getMockMailService();

      const signupRes = await request(getApp().getHttpServer())
        .post('/api/auth/signup')
        .send({ email, username: `l_r_${uid}`, password })
        .expect(201);
      const signupCode = mailService.verificationEmails.get(email.toLowerCase());
      await request(getApp().getHttpServer())
        .post('/api/auth/verify-email')
        .set('Authorization', `Bearer ${signupRes.body.verificationToken}`)
        .send({ code: signupCode })
        .expect(200);

      // Request reset code
      await request(getApp().getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(201);

      const correctCode = mailService.passwordResetEmails.get(email.toLowerCase());
      expect(correctCode).toBeDefined();

      // Send 5 incorrect codes (000001 to 000005)
      for (let i = 1; i <= 5; i++) {
        const wrongRes = await request(getApp().getHttpServer())
          .post('/api/auth/reset-password')
          .send({ email, code: `00000${i}`, newPassword: 'BrandNewPass1!' })
          .expect(400);

        if (i < 5) {
          expect(wrongRes.body.message).toBe('رمز إعادة التعيين غير صحيح');
        } else {
          expect(wrongRes.body.message).toBe('تم تجاوز عدد المحاولات. اطلب رمزاً جديداً.');
        }
      }

      // Attempting with the CORRECT code now must fail with TOO_MANY_ATTEMPTS
      const attemptAfterLockout = await request(getApp().getHttpServer())
        .post('/api/auth/reset-password')
        .send({ email, code: correctCode, newPassword: 'BrandNewPass1!' })
        .expect(400);

      expect(attemptAfterLockout.body.message).toBe('تم تجاوز عدد المحاولات. اطلب رمزاً جديداً.');
    });
  });

  /* ═══════════════════════════════════════════════════════════════
   * (E) Refresh token rotation, replay detection, and logout
   * ═══════════════════════════════════════════════════════════════ */
  describe('(E) Refresh token rotation, replay detection, and logout', () => {
    it('rotates normally; post-30s reuse revokes entire family with 401; logout revokes entire family', async () => {
      const prisma = getPrisma();
      const { refreshToken, user } = await registerUser();

      // 1. Normal refresh rotates the token
      const refreshRes = await request(getApp().getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(201);

      const rotatedToken = refreshRes.body.refreshToken;
      expect(rotatedToken).toBeDefined();
      expect(rotatedToken).not.toBe(refreshToken);

      // 2. Find old token row in DB and artificially age rotatedAt past 30 seconds
      const oldRow = await prisma.refreshToken.findFirst({
        where: { userId: user.id, replacedById: { not: null } },
      });
      expect(oldRow).toBeDefined();
      expect(oldRow!.familyId).toBeDefined();

      await prisma.refreshToken.update({
        where: { id: oldRow!.id },
        data: {
          rotatedAt: new Date(Date.now() - 45000), // 45 seconds ago (> 30s)
        },
      });

      // 3. Reusing the old token after 30s triggers malicious reuse -> revokes entire family & 401
      await request(getApp().getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      // 4. Verifying entire family is revoked in DB
      const activeTokensInFamily = await prisma.refreshToken.findMany({
        where: { familyId: oldRow!.familyId, revokedAt: null },
      });
      expect(activeTokensInFamily.length).toBe(0);

      // 5. Even the rotated token is now revoked and returns 401
      await request(getApp().getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: rotatedToken })
        .expect(401);

      // 6. Test logout revokes entire family:
      const loginRes = await request(getApp().getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: 'TestPass123!' })
        .expect(201);

      const sessionRefreshToken = loginRes.body.refreshToken;

      // In a concurrent race, two active tokens are issued in the same family:
      const [race1, race2] = await Promise.all([
        request(getApp().getHttpServer()).post('/api/auth/refresh').send({ refreshToken: sessionRefreshToken }),
        request(getApp().getHttpServer()).post('/api/auth/refresh').send({ refreshToken: sessionRefreshToken }),
      ]);
      expect(race1.status).toBe(201);
      expect(race2.status).toBe(201);
      const activeToken1 = race1.body.refreshToken;
      const activeToken2 = race2.body.refreshToken;

      // Logout with activeToken1: must revoke the entire family
      await request(getApp().getHttpServer())
        .post('/api/auth/logout')
        .send({ refreshToken: activeToken1 })
        .expect(201);

      // Both tokens in the family now fail on refresh
      await request(getApp().getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: activeToken1 })
        .expect(401);

      await request(getApp().getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: activeToken2 })
        .expect(401);
    });
  });

  /* ═══════════════════════════════════════════════════════════════
   * (F) Anti-enumeration parity for reset-password
   * ═══════════════════════════════════════════════════════════════ */
  describe('(F) Anti-enumeration parity for reset-password', () => {
    it('returns identical 400 Bad Request and exact same Arabic error message for non-existent email vs existing email without challenge', async () => {
      const nonExistentEmail = `nonexistent_${uniqueId()}@test.com`;
      const { user: existingUser } = await registerUser();

      // 1. Non-existent email
      const nonExistentRes = await request(getApp().getHttpServer())
        .post('/api/auth/reset-password')
        .send({ email: nonExistentEmail, code: '123456', newPassword: 'NewPassword123!' })
        .expect(400);

      // 2. Existing email without active code
      const existingRes = await request(getApp().getHttpServer())
        .post('/api/auth/reset-password')
        .send({ email: existingUser.email, code: '123456', newPassword: 'NewPassword123!' })
        .expect(400);

      expect(nonExistentRes.body.statusCode).toBe(400);
      expect(existingRes.body.statusCode).toBe(400);
      expect(nonExistentRes.body.message).toBe('رمز إعادة التعيين منتهي. اطلب رمزاً جديداً.');
      expect(existingRes.body.message).toBe('رمز إعادة التعيين منتهي. اطلب رمزاً جديداً.');
      expect(nonExistentRes.body.message).toBe(existingRes.body.message);
    });
  });
});
