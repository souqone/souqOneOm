import { execSync } from 'child_process';
import * as path from 'path';
import { PrismaClient, OtpPurpose } from '@prisma/client';
import { OtpService } from '../auth/otp.service';
import { WhatsappLimitsService } from './whatsapp-limits.service';
import { PhoneOtpService } from './phone-otp.service';
import { PhoneVerificationService } from './phone-verification.service';
import { MockWhatsappOtpSender } from './senders/mock-whatsapp-sender.service';

function getLocalDbUrls() {
  const rawUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/postgres';
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

  const TEST_DB_NAME = 'concurrency_phone_verify_test_db';
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

describeOrSkip('PhoneVerificationService Real PostgreSQL Concurrency (127.0.0.1)', () => {
  const { testDbName: TEST_DB_NAME, baseUrl: BASE_URL, testDbUrl: TEST_DB_URL } = dbConfig || {
    testDbName: 'concurrency_phone_verify_test_db',
    baseUrl: '',
    testDbUrl: '',
  };

  let prisma: PrismaClient;
  let otpService: OtpService;
  let limitsService: WhatsappLimitsService;
  let mockSender: MockWhatsappOtpSender;
  let phoneOtpService: PhoneOtpService;
  let verificationService: PhoneVerificationService;

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
    verificationService = new PhoneVerificationService(
      prisma as any,
      phoneOtpService,
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

  it('two distinct users simultaneously verify the exact same phone: exactly one wins and the other gets 409 PHONE_ALREADY_VERIFIED', async () => {
    const testPhone = '+96891112233';

    // 1. Create two distinct users in the temporary database with the same phone in their profile
    const userA = await prisma.user.create({
      data: {
        id: 'user_race_a',
        username: 'race_user_a',
        email: 'race_a@example.com',
        phone: testPhone,
      },
    });

    const userB = await prisma.user.create({
      data: {
        id: 'user_race_b',
        username: 'race_user_b',
        email: 'race_b@example.com',
        phone: testPhone,
      },
    });

    // 2. Both users have active OTP challenges issued for the same phone
    const { getAuthPepper } = require('../config/pepper.config');
    const pepper = getAuthPepper();
    const expiresAt = new Date(Date.now() + 600000);

    const challengeIdA = require('crypto').randomUUID();
    const codeA = '123456';
    const codeHashA = require('crypto')
      .createHmac('sha256', pepper)
      .update(`${OtpPurpose.PHONE_VERIFY}:${testPhone}:${challengeIdA}:${codeA}`)
      .digest('hex');

    await prisma.otpChallenge.create({
      data: {
        id: challengeIdA,
        userId: userA.id,
        phoneE164: testPhone,
        purpose: OtpPurpose.PHONE_VERIFY,
        codeHash: codeHashA,
        attempts: 0,
        maxAttempts: 5,
        expiresAt,
      },
    });

    const challengeIdB = require('crypto').randomUUID();
    const codeB = '654321';
    const codeHashB = require('crypto')
      .createHmac('sha256', pepper)
      .update(`${OtpPurpose.PHONE_VERIFY}:${testPhone}:${challengeIdB}:${codeB}`)
      .digest('hex');

    await prisma.otpChallenge.create({
      data: {
        id: challengeIdB,
        userId: userB.id,
        phoneE164: testPhone,
        purpose: OtpPurpose.PHONE_VERIFY,
        codeHash: codeHashB,
        attempts: 0,
        maxAttempts: 5,
        expiresAt,
      },
    });

    // 3. Fire concurrent verification requests at the exact same moment
    const [resultA, resultB] = await Promise.allSettled([
      verificationService.verifyPhone(userA.id, codeA),
      verificationService.verifyPhone(userB.id, codeB),
    ]);

    // 4. Assert that exactly ONE succeeded and exactly ONE was rejected with 409 Conflict
    const succeeded = [resultA, resultB].filter((r) => r.status === 'fulfilled');
    const rejected = [resultA, resultB].filter((r) => r.status === 'rejected');

    expect(succeeded.length).toBe(1);
    expect(rejected.length).toBe(1);

    const successfulResult = (succeeded[0] as PromiseFulfilledResult<any>).value;
    expect(successfulResult).toEqual({ phoneVerified: true });

    const failedReason = (rejected[0] as PromiseRejectedResult).reason;
    expect(failedReason).toBeDefined();
    expect(failedReason.response?.statusCode).toBe(409);
    expect(failedReason.response?.code).toBe('PHONE_ALREADY_VERIFIED');
    expect(failedReason.response?.message).toBe('رقم الهاتف هذا موثق بالفعل لحساب آخر');

    // 5. Query the database directly: verify exactly ONE user has phoneE164 set
    const verifiedUsers = await prisma.user.findMany({
      where: { phoneE164: testPhone },
    });

    expect(verifiedUsers.length).toBe(1);
    expect(['user_race_a', 'user_race_b']).toContain(verifiedUsers[0].id);
    expect(verifiedUsers[0].phoneVerifiedAt).toBeInstanceOf(Date);
  });
});
