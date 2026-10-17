import { execSync } from 'child_process';
import * as path from 'path';
import { PrismaClient, AccountStatus, UserRole, OtpPurpose, BanBlacklistKind } from '@prisma/client';
import { BanBlacklistService } from '../../ban-blacklist/ban-blacklist.service';
import { AccountStatusService } from '../account-status.service';
import { PhoneAuthService } from '../phone-auth.service';
import { PhoneOtpService } from '../../whatsapp/phone-otp.service';
import { ForbiddenException } from '@nestjs/common';

function getLocalDbUrls(): { testDbName: string; baseUrl: string; testDbUrl: string } | null {
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

  const TEST_DB_NAME = 'integration_phone_login_test_db';
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

describeOrSkip('Phone Login & Signup v2 Real PostgreSQL Integration & Concurrency', () => {
  const { testDbName: TEST_DB_NAME, baseUrl: BASE_URL, testDbUrl: TEST_DB_URL } = dbConfig || {
    testDbName: 'integration_phone_login_test_db',
    baseUrl: '',
    testDbUrl: '',
  };

  let prisma: PrismaClient;
  let banBlacklistService: BanBlacklistService;
  let accountStatusService: AccountStatusService;
  let phoneOtpService: PhoneOtpService;
  let phoneAuthService: PhoneAuthService;

  beforeAll(async () => {
    // 1. Create fresh isolated temporary database
    const bootstrapPrisma = new PrismaClient({
      datasources: { db: { url: BASE_URL } },
    });
    await bootstrapPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}" WITH (FORCE);`);
    try {
      await bootstrapPrisma.$executeRawUnsafe(`CREATE DATABASE "${TEST_DB_NAME}" WITH TEMPLATE template0 ENCODING 'UTF8';`);
    } catch {
      try {
        await bootstrapPrisma.$executeRawUnsafe(`CREATE DATABASE "${TEST_DB_NAME}" WITH ENCODING 'UTF8';`);
      } catch {
        await bootstrapPrisma.$executeRawUnsafe(`CREATE DATABASE "${TEST_DB_NAME}";`);
      }
    }
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
    accountStatusService = new AccountStatusService(prisma as any, { invalidate: jest.fn().mockResolvedValue(undefined) } as any);

    // Mock PhoneOtpService to simulate valid OTP verification
    phoneOtpService = {
      request: jest.fn().mockResolvedValue({ providerMessageId: 'msg-real-db' }),
      verify: jest.fn().mockImplementation(async ({ code }) => {
        if (code === '000000') {
          throw new Error('INVALID_OTP');
        }
        return { verified: true };
      }),
    } as any;

    const mockTokens = {
      signAccessToken: jest.fn().mockResolvedValue('jwt-access-token-real'),
      generateRefreshToken: jest.fn().mockResolvedValue('refresh-token-real'),
      sanitizeUser: jest.fn((u) => {
        const { passwordHash, ...rest } = u;
        return rest;
      }),
    } as any;

    const mockAudit = {
      logAudit: jest.fn().mockResolvedValue(undefined),
    } as any;

    phoneAuthService = new PhoneAuthService(
      prisma as any,
      phoneOtpService,
      mockTokens,
      mockAudit,
      accountStatusService,
      banBlacklistService,
    );
  }, 60000);

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    const cleanupPrisma = new PrismaClient({
      datasources: { db: { url: BASE_URL } },
    });
    try {
      await cleanupPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}" WITH (FORCE);`);
    } catch {
      // ignore
    } finally {
      await cleanupPrisma.$disconnect();
    }
  });

  describe('1. Orphan Blacklist Row (userId: null) + OTP Success', () => {
    it('returns 403 PHONE_NOT_ALLOWED and DOES NOT create a user', async () => {
      const blockedPhone = '+96898881111';
      const phoneHash = banBlacklistService.hashPhone(blockedPhone);

      // Create orphan blacklist row
      await prisma.banBlacklistEntry.create({
        data: {
          kind: BanBlacklistKind.PHONE,
          hash: phoneHash,
          userId: null,
          reason: 'Permanent spammer block list',
        },
      });

      await expect(
        phoneAuthService.verifyOtp({ phone: blockedPhone, code: '123456' }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 403,
          response: expect.objectContaining({
            code: 'PHONE_NOT_ALLOWED',
            message: 'رقم الهاتف غير مسموح به',
          }),
        }),
      );

      // Verify no user was created in DB
      const user = await prisma.user.findUnique({
        where: { phoneE164: blockedPhone },
      });
      expect(user).toBeNull();
    });
  });

  describe('2. Existing Banned Account', () => {
    it('returns 403 ACCOUNT_BANNED when existing user is banned', async () => {
      const bannedPhone = '+96898882222';
      await prisma.user.create({
        data: {
          id: 'user_banned_db_1',
          username: 'user_banned_db',
          displayName: 'محظور',
          phone: bannedPhone,
          phoneE164: bannedPhone,
          phoneVerifiedAt: new Date(),
          status: AccountStatus.BANNED,
        },
      });

      await expect(
        phoneAuthService.verifyOtp({ phone: bannedPhone, code: '123456' }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: 403,
          response: expect.objectContaining({
            code: 'ACCOUNT_BANNED',
          }),
        }),
      );
    });
  });

  describe('3. Concurrent verify for brand new phone (Deterministic Concurrency Race)', () => {
    it('two parallel verify requests create exactly 1 user and both return tokens for the winning user', async () => {
      const newPhone = `+9689${Math.floor(1000000 + Math.random() * 9000000)}`;

      // Launch both verify requests concurrently against real PostgreSQL
      const [res1, res2] = await Promise.all([
        phoneAuthService.verifyOtp({ phone: newPhone, code: '123456' }),
        phoneAuthService.verifyOtp({ phone: newPhone, code: '123456' }),
      ]);

      expect(res1).toBeDefined();
      expect(res2).toBeDefined();

      // Both requests must authenticate the exact same user
      expect(res1.user.id).toBe(res2.user.id);
      expect(res1.user.phoneE164).toBe(newPhone);

      // Verify in DB that only 1 user exists with this phone
      const usersInDb = await prisma.user.findMany({
        where: { phoneE164: newPhone },
      });
      expect(usersInDb.length).toBe(1);
      expect(usersInDb[0].isVerified).toBe(true);
      expect(usersInDb[0].phoneVerifiedAt).not.toBeNull();
      expect(usersInDb[0].status).toBe(AccountStatus.ACTIVE);
      expect(usersInDb[0].username).toMatch(/^user_[a-f0-9]{8}$/);
      expect(usersInDb[0].displayName).toBe(`مستخدم ${newPhone.slice(-4)}`);
    });
  });
});
