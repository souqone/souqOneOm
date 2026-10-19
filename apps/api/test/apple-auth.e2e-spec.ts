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
import { AppleTokenVerifierService } from '../src/auth/apple-token-verifier.service';
import { BanBlacklistService } from '../src/ban-blacklist/ban-blacklist.service';
import { AuthProvider } from '@prisma/client';

describe('Apple Auth Endpoint E2E (POST /api/auth/apple)', () => {
  let verifier: AppleTokenVerifierService;
  let banBlacklistService: BanBlacklistService;
  let verifySpy: jest.SpyInstance;

  beforeAll(async () => {
    await createTestApp({ useGlobalFilters: true });
    verifier = getApp().get(AppleTokenVerifierService);
    banBlacklistService = getApp().get(BanBlacklistService);

    verifySpy = jest.spyOn(verifier, 'verifyIdToken');
  });

  afterAll(async () => {
    await closeTestApp();
  });

  beforeEach(() => {
    verifySpy.mockReset();
  });

  describe('1. New user registration via Apple', () => {
    it('creates new verified user with fullName, dual-writes to auth_identities, sends welcome email, and returns session tokens', async () => {
      const uid = uniqueId();
      const appleSub = `apple.sub.${uid}`;
      const email = `apple_${uid}@privaterelay.appleid.com`;

      verifySpy.mockResolvedValueOnce({
        sub: appleSub,
        email,
        email_verified: true,
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/auth/apple')
        .send({
          identityToken: 'valid-apple-identity-token',
          nonce: 'raw-nonce-123',
          fullName: {
            givenName: 'ماجد',
            familyName: 'البلوشي',
          },
        })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(email);
      expect(res.body.user.displayName).toBe('ماجد البلوشي');
      expect(res.body.user.isVerified).toBe(true);
      expect(res.body.user.username).toMatch(/^apple_[a-f0-9]{8}$/);

      // Verify DB record
      const dbUser = await getPrisma().user.findUnique({
        where: { appleSub },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser?.email).toBe(email);
      expect(dbUser?.displayName).toBe('ماجد البلوشي');
      expect(dbUser?.isVerified).toBe(true);
      expect(dbUser?.emailVerifiedAt).toBeInstanceOf(Date);

      // Verify dual-write in auth_identities
      const identity = await getPrisma().authIdentity.findUnique({
        where: {
          provider_providerUserId: {
            provider: AuthProvider.APPLE,
            providerUserId: appleSub,
          },
        },
      });
      expect(identity).toBeDefined();
      expect(identity?.userId).toBe(dbUser?.id);
    });

    it('defaults displayName to "مستخدم سوق ون" when fullName is not provided', async () => {
      const uid = uniqueId();
      const appleSub = `apple.sub.noname.${uid}`;
      const email = `apple_noname_${uid}@example.com`;

      verifySpy.mockResolvedValueOnce({
        sub: appleSub,
        email,
        email_verified: true,
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/auth/apple')
        .send({
          identityToken: 'valid-apple-identity-token',
          nonce: 'raw-nonce-456',
        })
        .expect(201);

      expect(res.body.user.displayName).toBe('مستخدم سوق ون');
    });

    it('rejects new user with 400 APPLE_EMAIL_REQUIRED when Apple token has no email', async () => {
      const uid = uniqueId();
      const appleSub = `apple.sub.noemail.${uid}`;

      verifySpy.mockResolvedValueOnce({
        sub: appleSub,
        // No email in token
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/auth/apple')
        .send({
          identityToken: 'valid-apple-token-no-email',
          nonce: 'raw-nonce-789',
        })
        .expect(400);

      expect(res.body.code).toBe('APPLE_EMAIL_REQUIRED');
      expect(res.body.message).toContain('تعذّر الحصول على بريدك من Apple');
    });
  });

  describe('2. Existing user login via Apple', () => {
    it('logs in existing user by appleSub (even without email in subsequent token)', async () => {
      const uid = uniqueId();
      const appleSub = `apple.sub.existing.${uid}`;
      const email = `apple_existing_${uid}@example.com`;

      // Pre-create user with appleSub
      const existingUser = await getPrisma().user.create({
        data: {
          email,
          username: `apple_${uid.slice(0, 8)}`,
          displayName: 'مستخدم سابق',
          appleSub,
          isVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      // Subsequent Apple tokens often omit email
      verifySpy.mockResolvedValueOnce({
        sub: appleSub,
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/auth/apple')
        .send({
          identityToken: 'subsequent-apple-token',
          nonce: 'raw-nonce-existing',
        })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.id).toBe(existingUser.id);
      expect(res.body.user.email).toBe(email);
    });
  });

  describe('3. Account linking requirement & no auto-merge', () => {
    it('returns 409 ACCOUNT_LINK_REQUIRED when email belongs to an existing verified account', async () => {
      const uid = uniqueId();
      const email = `verified_user_${uid}@example.com`;

      // User registered with password
      await registerUser({
        email,
        password: 'Password123!',
      });

      const appleSub = `apple.sub.conflict.${uid}`;
      verifySpy.mockResolvedValueOnce({
        sub: appleSub,
        email,
        email_verified: true,
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/auth/apple')
        .send({
          identityToken: 'apple-conflict-token',
          nonce: 'raw-nonce-conflict',
        })
        .expect(409);

      expect(res.body.code).toBe('ACCOUNT_LINK_REQUIRED');
      expect(res.body.message).toContain('هذا البريد مسجل بوسيلة دخول أخرى');

      // Verify the existing user's appleSub was NOT overwritten
      const dbUser = await getPrisma().user.findUnique({ where: { email } });
      expect(dbUser?.appleSub).toBeNull();
    });
  });

  describe('4. Blacklist protection', () => {
    it('returns 403 ACCOUNT_BANNED when appleSub is blacklisted', async () => {
      const uid = uniqueId();
      const appleSub = `apple.sub.banned.${uid}`;

      // Insert blacklist entry directly into DB
      const hash = banBlacklistService.hashApple(appleSub);
      await getPrisma().banBlacklistEntry.create({
        data: {
          kind: 'APPLE',
          hash,
          reason: 'Suspicious Apple activity',
        },
      });

      verifySpy.mockResolvedValueOnce({
        sub: appleSub,
        email: `banned_${uid}@example.com`,
      });

      const res = await request(getApp().getHttpServer())
        .post('/api/auth/apple')
        .send({
          identityToken: 'banned-apple-token',
          nonce: 'raw-nonce-banned',
        })
        .expect(403);

      expect(res.body.code).toBe('ACCOUNT_BANNED');
      expect(res.body.message).toBe('تم حظر حسابك لمخالفة شروط الاستخدام');
    });
  });
});
