import { execSync } from 'child_process';
import * as path from 'path';
import * as crypto from 'crypto';
import { Client } from 'pg';
import {
  PrismaClient,
  AccountStatus,
  UserRole,
  AuthProvider,
  BanBlacklistKind,
  OtpPurpose,
} from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { BanBlacklistService, computeBanBlacklistHash } from '../ban-blacklist.service';
import { AdminUsersService } from '../../admin-users/admin-users.service';
import { PhoneVerificationService } from '../../whatsapp/phone-verification.service';
import { PhoneOtpService } from '../../whatsapp/phone-otp.service';
import { WhatsappLimitsService } from '../../whatsapp/whatsapp-limits.service';
import { MockWhatsappOtpSender } from '../../whatsapp/senders/mock-whatsapp-sender.service';
import { OtpService } from '../../auth/otp.service';
import { AuthService } from '../../auth/auth.service';
import { AccountStatusService } from '../../auth/account-status.service';
import { getAuthPepper } from '../../config/pepper.config';

function getLocalDbUrls() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  const hostname = parsed.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return null;
  }

  const TEST_DB_NAME = 'integration_ban_blacklist_test_db';
  const baseUrlObj = new URL(parsed.toString());
  baseUrlObj.pathname = '/postgres';

  const testDbUrlObj = new URL(parsed.toString());
  testDbUrlObj.pathname = `/${TEST_DB_NAME}`;

  return {
    testDbName: TEST_DB_NAME,
    baseUrl: baseUrlObj.toString(),
    testDbUrl: testDbUrlObj.toString(),
  };
}

const dbConfig = getLocalDbUrls();
const shouldRun = process.env.RUN_DB_CONCURRENCY_TESTS === '1' && dbConfig !== null;
const describeOrSkip = shouldRun ? describe : describe.skip;

describeOrSkip('BanBlacklist Integration & Real PostgreSQL Deterministic Concurrency', () => {
  const { testDbName: TEST_DB_NAME, baseUrl: BASE_URL, testDbUrl: TEST_DB_URL } = dbConfig || {
    testDbName: 'integration_ban_blacklist_test_db',
    baseUrl: '',
    testDbUrl: '',
  };

  let prisma: PrismaClient;
  let banBlacklistService: BanBlacklistService;
  let adminUsersService: AdminUsersService;
  let verificationService: PhoneVerificationService;
  let phoneOtpService: PhoneOtpService;
  let authService: AuthService;
  let otpService: OtpService;

  const adminJwt = {
    sub: 'admin_master_1',
    role: UserRole.ADMIN,
    email: 'admin@souqone.app',
  } as any;

  beforeAll(async () => {
    // 1. Create fresh isolated temporary database
    const bootstrapPrisma = new PrismaClient({
      datasources: { db: { url: BASE_URL } },
    });
    await bootstrapPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}" WITH (FORCE);`);
    await bootstrapPrisma.$executeRawUnsafe(`CREATE DATABASE "${TEST_DB_NAME}";`);
    await bootstrapPrisma.$disconnect();

    // 2. Push Prisma schema into temporary database
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      cwd: path.resolve(__dirname, '../../..'),
      env: {
        ...process.env,
        DATABASE_URL: TEST_DB_URL,
      },
      stdio: 'pipe',
    });

    // 3. Connect real PrismaClient to temporary database
    prisma = new PrismaClient({
      datasources: { db: { url: TEST_DB_URL } },
    });
    await prisma.$connect();

    // 4. Instantiate real services
    banBlacklistService = new BanBlacklistService(prisma as any);

    const mockTokenService = {
      revokeAllRefreshTokens: jest.fn().mockResolvedValue(undefined),
      createTokens: jest.fn().mockResolvedValue({
        accessToken: 'access-mock-token',
        refreshToken: 'refresh-mock-token',
      }),
    };
    const mockChatGateway = {
      disconnectUser: jest.fn().mockResolvedValue(undefined),
    };
    const mockAdminAudit = {
      record: jest.fn().mockResolvedValue({}),
    };

    const mockGate = {
      invalidate: jest.fn().mockResolvedValue(undefined),
      validate: jest.fn().mockResolvedValue({ tv: 0, status: 'ACTIVE', role: 'USER' }),
    };

    adminUsersService = new AdminUsersService(
      prisma as any,
      mockTokenService as any,
      mockGate as any,
      mockChatGateway as any,
      mockAdminAudit as any,
      banBlacklistService,
    );

    otpService = new OtpService(prisma as any);
    const limitsService = new WhatsappLimitsService();
    const mockSender = new MockWhatsappOtpSender();
    phoneOtpService = new PhoneOtpService(
      prisma as any,
      otpService,
      limitsService,
      mockSender,
    );

    verificationService = new PhoneVerificationService(
      prisma as any,
      phoneOtpService,
      banBlacklistService,
    );

    const mockMail = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };
    const mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      incr: jest.fn().mockResolvedValue(1),
      getTTL: jest.fn().mockResolvedValue(900),
    };
    const mockJwt = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    };
    const mockAuthAudit = {
      record: jest.fn().mockResolvedValue({}),
      logAudit: jest.fn().mockResolvedValue({}),
    };
    const accountStatusService = new AccountStatusService(
      prisma as any,
      mockGate as any,
    );

    authService = new AuthService(
      prisma as any,
      mockMail as any,
      mockTokenService as any,
      mockAuthAudit as any,
      otpService,
      mockGate as any,
      accountStatusService,
      banBlacklistService,
    );
  }, 45000);

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    const bootstrapPrisma = new PrismaClient({
      datasources: { db: { url: BASE_URL } },
    });
    try {
      await bootstrapPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}" WITH (FORCE);`);
    } catch {
      // Best-effort cleanup
    } finally {
      await bootstrapPrisma.$disconnect();
    }
  });

  // Helper to issue a phone OTP challenge directly in the database
  async function seedPhoneOtpChallenge(userId: string, phoneE164: string, code: string) {
    const pepper = getAuthPepper();
    const challengeId = crypto.randomUUID();
    const codeHash = crypto
      .createHmac('sha256', pepper)
      .update(`${OtpPurpose.PHONE_VERIFY}:${phoneE164}:${challengeId}:${code}`)
      .digest('hex');

    await prisma.otpChallenge.create({
      data: {
        id: challengeId,
        userId,
        phoneE164,
        purpose: OtpPurpose.PHONE_VERIFY,
        codeHash,
        attempts: 0,
        maxAttempts: 5,
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    return challengeId;
  }

  describe('(A) Real AdminUsersService.banUser writes hashed blacklist entries', () => {
    it('populates ban_blacklist_entries with hashed phone and googleId, verified hash !== raw', async () => {
      const testPhone = '+96891234567';
      const testGoogleSub = 'google-sub-user-a';

      const user = await prisma.user.create({
        data: {
          id: 'user_ban_test_a',
          username: 'user_ban_a',
          email: 'user_ban_a@example.com',
          phoneE164: testPhone,
          phoneVerifiedAt: new Date(),
          googleId: testGoogleSub,
          status: AccountStatus.ACTIVE,
        },
      });

      // Also add AuthIdentity for Google to ensure comprehensive resolution
      await prisma.authIdentity.create({
        data: {
          id: 'auth_ident_user_a',
          userId: user.id,
          provider: AuthProvider.GOOGLE,
          providerUserId: testGoogleSub,
        },
      });

      // Execute real banUser
      await adminUsersService.banUser(adminJwt, user.id, {
        reason: 'Violation of Terms of Service',
      });

      // Read ban_blacklist_entries from real database
      const entries = await prisma.banBlacklistEntry.findMany({
        where: { userId: user.id },
      });

      expect(entries.length).toBe(2);

      const phoneEntry = entries.find((e) => e.kind === BanBlacklistKind.PHONE);
      const googleEntry = entries.find((e) => e.kind === BanBlacklistKind.GOOGLE);

      expect(phoneEntry).toBeDefined();
      expect(googleEntry).toBeDefined();

      // Verify that stored hash is NOT the raw phone or raw google sub
      expect(phoneEntry!.hash).not.toBe(testPhone);
      expect(googleEntry!.hash).not.toBe(testGoogleSub);

      // Verify exact HMAC-SHA256 hash match
      expect(phoneEntry!.hash).toBe(computeBanBlacklistHash('PHONE', testPhone));
      expect(googleEntry!.hash).toBe(computeBanBlacklistHash('GOOGLE', testGoogleSub));
      expect(phoneEntry!.reason).toBe('Violation of Terms of Service');
      expect(googleEntry!.reason).toBe('Violation of Terms of Service');
    });
  });

  describe('(B) Real AdminUsersService.unbanUser and Deletion Isolation', () => {
    it('removes only the unbanned user entries, preserving other banned users and orphan entries', async () => {
      const phone1 = '+96891110001';
      const phone2 = '+96891110002';
      const orphanPhone = '+96891110099';

      const user1 = await prisma.user.create({
        data: {
          id: 'user_isolation_1',
          username: 'iso_user_1',
          email: 'iso_1@example.com',
          phoneE164: phone1,
          phoneVerifiedAt: new Date(),
          status: AccountStatus.ACTIVE,
        },
      });

      const user2 = await prisma.user.create({
        data: {
          id: 'user_isolation_2',
          username: 'iso_user_2',
          email: 'iso_2@example.com',
          phoneE164: phone2,
          phoneVerifiedAt: new Date(),
          status: AccountStatus.ACTIVE,
        },
      });

      // Ban both users
      await adminUsersService.banUser(adminJwt, user1.id, { reason: 'Ban 1' });
      await adminUsersService.banUser(adminJwt, user2.id, { reason: 'Ban 2' });

      // Create an orphan blacklist entry with userId: null (simulating account deleted post-ban)
      const orphanHash = banBlacklistService.hashPhone(orphanPhone);
      await prisma.banBlacklistEntry.create({
        data: {
          id: 'orphan_entry_isolated',
          kind: BanBlacklistKind.PHONE,
          hash: orphanHash,
          userId: null,
          reason: 'Permanent blacklist preserved post-account-deletion',
        },
      });

      // Unban User 1
      await adminUsersService.unbanUser(adminJwt, user1.id, { reason: 'Evidence cleared' });

      // Check remaining entries in database
      const remainingUser1Entries = await prisma.banBlacklistEntry.findMany({
        where: { userId: user1.id },
      });
      const remainingUser2Entries = await prisma.banBlacklistEntry.findMany({
        where: { userId: user2.id },
      });
      const remainingOrphan = await prisma.banBlacklistEntry.findUnique({
        where: { id: 'orphan_entry_isolated' },
      });

      expect(remainingUser1Entries.length).toBe(0);
      expect(remainingUser2Entries.length).toBe(1);
      expect(remainingUser2Entries[0].hash).toBe(banBlacklistService.hashPhone(phone2));
      expect(remainingOrphan).toBeDefined();
      expect(remainingOrphan!.userId).toBeNull();
      expect(remainingOrphan!.hash).toBe(orphanHash);
    });
  });

  describe('(C) Post-ban rejection: Active Banned Account vs Account Deleted Post-Ban (userId: null)', () => {
    it('regular banned user: googleAuth rejects 403 ACCOUNT_BANNED and verifyPhone rejects 403 PHONE_NOT_ALLOWED', async () => {
      const bannedPhone = '+96892223344';
      const bannedGoogleSub = 'banned-google-sub-active';

      const user = await prisma.user.create({
        data: {
          id: 'user_postban_active',
          username: 'user_postban_act',
          email: 'postban_act@example.com',
          phone: bannedPhone,
          phoneE164: bannedPhone,
          phoneVerifiedAt: new Date(),
          googleId: bannedGoogleSub,
          status: AccountStatus.ACTIVE,
        },
      });

      await adminUsersService.banUser(adminJwt, user.id, { reason: 'Spamming' });

      // Clear verified state to simulate re-verification attempt on the blacklisted phone
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerifiedAt: null, phoneE164: null },
      });

      // 1. googleAuth with the banned sub
      (authService as any).googleClient = {
        verifyIdToken: jest.fn().mockResolvedValue({
          getPayload: () => ({
            sub: bannedGoogleSub,
            email: 'new_attempt@example.com',
            email_verified: true,
          }),
        }),
      };

      let googleErr: any;
      try {
        await authService.googleAuth({ credential: 'mock-banned-token' });
      } catch (err) {
        googleErr = err;
      }
      expect(googleErr).toBeDefined();
      expect(googleErr.getStatus()).toBe(403);
      expect(googleErr.getResponse()).toEqual(
        expect.objectContaining({ code: 'ACCOUNT_BANNED' }),
      );

      // Verify no user was created with new_attempt@example.com
      const createdUser = await prisma.user.findUnique({
        where: { email: 'new_attempt@example.com' },
      });
      expect(createdUser).toBeNull();

      // 2. verifyPhone from the user with the banned phone
      const otpCode = '445566';
      await seedPhoneOtpChallenge(user.id, bannedPhone, otpCode);

      let verifyErr: any;
      try {
        await verificationService.verifyPhone(user.id, otpCode);
      } catch (err) {
        verifyErr = err;
      }
      expect(verifyErr).toBeDefined();
      expect(verifyErr.getStatus()).toBe(403);
      expect(verifyErr.getResponse()).toEqual(
        expect.objectContaining({ code: 'PHONE_NOT_ALLOWED' }),
      );
    });

    it('account deleted post-ban (userId: null): googleAuth rejects 403 ACCOUNT_BANNED and verifyPhone rejects 403 PHONE_NOT_ALLOWED', async () => {
      const deletedBannedPhone = '+96893334455';
      const deletedGoogleSub = 'google-sub-deleted-account';

      const userToDelete = await prisma.user.create({
        data: {
          id: 'user_to_delete_post_ban',
          username: 'to_be_deleted',
          email: 'deleted_user@example.com',
          phoneE164: deletedBannedPhone,
          phoneVerifiedAt: new Date(),
          googleId: deletedGoogleSub,
          status: AccountStatus.ACTIVE,
        },
      });

      // Ban the user
      await adminUsersService.banUser(adminJwt, userToDelete.id, { reason: 'Malicious activity' });

      // Delete the user from users table -> onDelete: SetNull sets userId: null in ban_blacklist_entries
      await prisma.user.delete({
        where: { id: userToDelete.id },
      });

      // Verify row now exists with userId: null
      const orphanEntries = await prisma.banBlacklistEntry.findMany({
        where: {
          hash: {
            in: [
              banBlacklistService.hashPhone(deletedBannedPhone),
              banBlacklistService.hashGoogle(deletedGoogleSub),
            ],
          },
        },
      });
      expect(orphanEntries.length).toBe(2);
      expect(orphanEntries[0].userId).toBeNull();
      expect(orphanEntries[1].userId).toBeNull();

      // 1. googleAuth with the deleted account's Google sub
      (authService as any).googleClient = {
        verifyIdToken: jest.fn().mockResolvedValue({
          getPayload: () => ({
            sub: deletedGoogleSub,
            email: 'trying_again@example.com',
            email_verified: true,
          }),
        }),
      };

      let googleDeletedErr: any;
      try {
        await authService.googleAuth({ credential: 'mock-deleted-token' });
      } catch (err) {
        googleDeletedErr = err;
      }
      expect(googleDeletedErr).toBeDefined();
      expect(googleDeletedErr.getStatus()).toBe(403);
      expect(googleDeletedErr.getResponse()).toEqual(
        expect.objectContaining({ code: 'ACCOUNT_BANNED' }),
      );

      const noNewUser = await prisma.user.findUnique({
        where: { email: 'trying_again@example.com' },
      });
      expect(noNewUser).toBeNull();

      // 2. verifyPhone from another distinct user with the deleted account's phone
      const secondUser = await prisma.user.create({
        data: {
          id: 'second_user_trying_deleted_phone',
          username: 'second_user',
          email: 'second@example.com',
          phone: deletedBannedPhone,
        },
      });

      const otpCode = '778899';
      await seedPhoneOtpChallenge(secondUser.id, deletedBannedPhone, otpCode);

      let verifySecondErr: any;
      try {
        await verificationService.verifyPhone(secondUser.id, otpCode);
      } catch (err) {
        verifySecondErr = err;
      }
      expect(verifySecondErr).toBeDefined();
      expect(verifySecondErr.getStatus()).toBe(403);
      expect(verifySecondErr.getResponse()).toEqual(
        expect.objectContaining({ code: 'PHONE_NOT_ALLOWED' }),
      );

      const secondUserFresh = await prisma.user.findUnique({
        where: { id: secondUser.id },
      });
      expect(secondUserFresh!.phoneVerifiedAt).toBeNull();
      expect(secondUserFresh!.phoneE164).toBeNull();
    });
  });

  describe('(D) Deterministic Concurrency Race in both directions using dedicated pg client holding FOR UPDATE', () => {
    it('Direction 1 (Ban First): verification blocks behind lock, ban marks BANNED, verification resumes and fails 403 ACCOUNT_BANNED', async () => {
      const racePhone1 = '+96894445566';
      const userRace1 = await prisma.user.create({
        data: {
          id: 'user_race_dir1',
          username: 'race_dir1',
          email: 'race_dir1@example.com',
          phone: racePhone1,
          status: AccountStatus.ACTIVE,
        },
      });

      const otpCode = '112233';
      await seedPhoneOtpChallenge(userRace1.id, racePhone1, otpCode);

      // Separate pg connection holding FOR UPDATE lock on user row
      const pgClient = new Client({ connectionString: TEST_DB_URL });
      await pgClient.connect();
      await pgClient.query('BEGIN');
      await pgClient.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userRace1.id]);

      // Launch verifyPhone concurrently (it will attempt to update users and block on row lock)
      let verifySettled = false;
      let verifyError: any = null;
      const verifyPromise = verificationService
        .verifyPhone(userRace1.id, otpCode)
        .catch((err) => {
          verifyError = err;
        })
        .finally(() => {
          verifySettled = true;
        });

      // Small pause to guarantee verifyPhone is executing and blocked in PostgreSQL
      await new Promise((r) => setTimeout(r, 100));
      expect(verifySettled).toBe(false);

      // The pg connection updates the user status to BANNED before releasing the lock
      await pgClient.query('UPDATE users SET status = $1 WHERE id = $2', [
        AccountStatus.BANNED,
        userRace1.id,
      ]);
      await pgClient.query('COMMIT');
      await pgClient.end();

      // Now verifyPhone unblocks and executes updateMany
      await verifyPromise;

      expect(verifySettled).toBe(true);
      expect(verifyError).toBeDefined();
      expect(verifyError.getStatus()).toBe(403);
      expect(verifyError.getResponse()).toEqual(
        expect.objectContaining({ code: 'ACCOUNT_BANNED' }),
      );

      // Verify that phoneVerifiedAt and phoneE164 were NEVER written to the database
      const freshUser = await prisma.user.findUnique({
        where: { id: userRace1.id },
      });
      expect(freshUser!.status).toBe(AccountStatus.BANNED);
      expect(freshUser!.phoneVerifiedAt).toBeNull();
      expect(freshUser!.phoneE164).toBeNull();
    });

    it('Direction 2 (Verification First): banUser blocks behind lock, verification commits phone, ban resumes and blacklists phone', async () => {
      const racePhone2 = '+96895556677';
      const userRace2 = await prisma.user.create({
        data: {
          id: 'user_race_dir2',
          username: 'race_dir2',
          email: 'race_dir2@example.com',
          phone: racePhone2,
          status: AccountStatus.ACTIVE,
        },
      });

      // Separate pg connection holding FOR UPDATE lock on user row
      const pgClient = new Client({ connectionString: TEST_DB_URL });
      await pgClient.connect();
      await pgClient.query('BEGIN');
      await pgClient.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userRace2.id]);

      // Launch adminUsersService.banUser concurrently (blocks on SELECT ... FOR UPDATE)
      let banSettled = false;
      let banResult: any = null;
      const banPromise = adminUsersService
        .banUser(adminJwt, userRace2.id, { reason: 'Deterministic race ban' })
        .then((res) => {
          banResult = res;
        })
        .finally(() => {
          banSettled = true;
        });

      // Small pause to guarantee banUser is executing and blocked on the row lock
      await new Promise((r) => setTimeout(r, 100));
      expect(banSettled).toBe(false);

      // The pg connection simulates verification committing first: sets phoneE164 and phoneVerifiedAt
      await pgClient.query(
        'UPDATE users SET "phoneE164" = $1, "phoneVerifiedAt" = NOW() WHERE id = $2',
        [racePhone2, userRace2.id],
      );
      await pgClient.query('COMMIT');
      await pgClient.end();

      // banUser unblocks, reads the newly committed phoneE164, bans user, and adds phone hash to blacklist
      await banPromise;

      expect(banSettled).toBe(true);
      expect(banResult).toBeDefined();
      expect(banResult.status).toBe(AccountStatus.BANNED);

      // Verify that the blacklist now contains the hash for racePhone2
      const isBlacklisted = await banBlacklistService.isPhoneBlocked(racePhone2);
      expect(isBlacklisted).toBe(true);

      const entry = await prisma.banBlacklistEntry.findFirst({
        where: {
          userId: userRace2.id,
          kind: BanBlacklistKind.PHONE,
        },
      });
      expect(entry).toBeDefined();
      expect(entry!.hash).toBe(banBlacklistService.hashPhone(racePhone2));
    });
  });
});
