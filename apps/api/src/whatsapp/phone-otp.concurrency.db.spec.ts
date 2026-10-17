import { execSync } from 'child_process';
import * as path from 'path';
import { PrismaClient, OtpPurpose } from '@prisma/client';
import { OtpService } from '../auth/otp.service';
import { WhatsappLimitsService } from './whatsapp-limits.service';
import { PhoneOtpService } from './phone-otp.service';
import { MockWhatsappOtpSender } from './senders/mock-whatsapp-sender.service';

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

  const TEST_DB_NAME = 'concurrency_otp_test_db';
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

describeOrSkip('PhoneOtpService Real PostgreSQL Concurrency (127.0.0.1)', () => {
  const { testDbName: TEST_DB_NAME, baseUrl: BASE_URL, testDbUrl: TEST_DB_URL } = dbConfig || {
    testDbName: 'concurrency_otp_test_db',
    baseUrl: '',
    testDbUrl: '',
  };

  let prisma: PrismaClient;
  let otpService: OtpService;
  let limitsService: WhatsappLimitsService;
  let mockSender: MockWhatsappOtpSender;
  let phoneOtpService: PhoneOtpService;
  const originalEnv = { ...process.env };

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
      cwd: path.resolve(__dirname, '../..'),
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
    otpService = new OtpService(prisma as any);
    limitsService = new WhatsappLimitsService();
    mockSender = new MockWhatsappOtpSender();
    phoneOtpService = new PhoneOtpService(
      prisma as any,
      otpService,
      limitsService,
      mockSender,
    );
  }, 45000);

  afterAll(async () => {
    process.env = originalEnv;
    if (prisma) {
      await prisma.$disconnect();
    }
    const teardownPrisma = new PrismaClient({
      datasources: { db: { url: BASE_URL } },
    });
    await teardownPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}" WITH (FORCE);`);
    await teardownPrisma.$disconnect();
  }, 30000);

  beforeEach(async () => {
    process.env = { ...originalEnv };
    delete process.env.WHATSAPP_DAILY_CAP;
    mockSender.clearMessages();
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "whatsapp_message_logs", "otp_challenges" CASCADE;`);
  });

  it('Test (A): 10 concurrent requests for same phone -> exactly 1 succeeds, 9 fail with OTP_COOLDOWN, 1 log row, 1 active challenge', async () => {
    const promises = Array.from({ length: 10 }).map(() =>
      phoneOtpService.request({
        phoneE164: '+96891234567',
        purpose: OtpPurpose.PHONE_VERIFY,
      }),
    );

    const results = await Promise.allSettled(promises);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(9);

    for (const r of rejected) {
      const reason = (r as PromiseRejectedResult).reason;
      expect(reason?.response?.code || reason?.code).toBe('OTP_COOLDOWN');
      expect(reason?.status || reason?.statusCode).toBe(429);
    }

    const logCount = await prisma.whatsappMessageLog.count();
    expect(logCount).toBe(1);

    const activeChallengeCount = await prisma.otpChallenge.count({
      where: {
        phoneE164: '+96891234567',
        consumedAt: null,
      },
    });
    expect(activeChallengeCount).toBe(1);
  }, 20000);

  it('Test (B): 15 concurrent requests from same IP for different phones -> successes do not exceed hourly IP limit (10) and no deadlock occurs', async () => {
    const promises = Array.from({ length: 15 }).map((_, i) =>
      phoneOtpService.request({
        phoneE164: `+968910000${String(i).padStart(2, '0')}`,
        purpose: OtpPurpose.PHONE_VERIFY,
        ip: '10.0.0.1',
      }),
    );

    const results = await Promise.allSettled(promises);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 10 succeed (hourly IP limit) and 5 are rejected with IP_HOURLY_LIMIT_EXCEEDED
    expect(fulfilled).toHaveLength(10);
    expect(rejected).toHaveLength(5);

    for (const r of rejected) {
      const reason = (r as PromiseRejectedResult).reason;
      expect(reason?.response?.code || reason?.code).toBe('OTP_RATE_LIMITED');
      expect(reason?.status || reason?.statusCode).toBe(429);
    }

    const logCount = await prisma.whatsappMessageLog.count();
    expect(logCount).toBe(10);
  }, 25000);

  it('Test (C): WHATSAPP_DAILY_CAP=3 and 8 concurrent requests for different phones & IPs -> exactly 3 succeed (proves global daily lock)', async () => {
    process.env.WHATSAPP_DAILY_CAP = '3';

    const promises = Array.from({ length: 8 }).map((_, i) =>
      phoneOtpService.request({
        phoneE164: `+968920000${String(i).padStart(2, '0')}`,
        purpose: OtpPurpose.PHONE_VERIFY,
        ip: `10.0.1.${i + 1}`,
      }),
    );

    const results = await Promise.allSettled(promises);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Global daily cap of 3 strictly respected under concurrency
    expect(fulfilled).toHaveLength(3);
    expect(rejected).toHaveLength(5);

    for (const r of rejected) {
      const reason = (r as PromiseRejectedResult).reason;
      expect(reason?.response?.code || reason?.code).toBe('OTP_DAILY_CAP_REACHED');
      expect(reason?.status || reason?.statusCode).toBe(429);
    }

    const logCount = await prisma.whatsappMessageLog.count();
    expect(logCount).toBe(3);
  }, 20000);
});
