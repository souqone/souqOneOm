import { execSync } from 'child_process';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { ActiveListingsLimitService } from '../common/services/active-listings-limit.service';

function getLocalDbUrls() {
  const rawUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5433/postgres';
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

  const TEST_DB_NAME = 'concurrency_publish_rate_limit_test_db';
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
const shouldRun = (process.env.RUN_DB_CONCURRENCY_TESTS === '1' || process.env.DATABASE_URL?.includes('5433')) && dbConfig !== null;
const describeOrSkip = shouldRun ? describe : describe.skip;

describeOrSkip('Publish Rate Limit Real PostgreSQL Concurrency (D-223)', () => {
  const { testDbName: TEST_DB_NAME, baseUrl: BASE_URL, testDbUrl: TEST_DB_URL } = dbConfig || {
    testDbName: 'concurrency_publish_rate_limit_test_db',
    baseUrl: '',
    testDbUrl: '',
  };

  let prisma: PrismaClient;
  let service: ActiveListingsLimitService;
  const originalEnv = { ...process.env };
  const TEST_USER_ID = 'test-publish-rate-user-1';
  const ADMIN_USER_ID = 'test-publish-rate-admin-1';

  beforeAll(async () => {
    // 1. Create fresh isolated temporary database
    const bootstrapPrisma = new PrismaClient({
      datasources: { db: { url: BASE_URL } },
    });
    await bootstrapPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}" WITH (FORCE);`);
    await bootstrapPrisma.$executeRawUnsafe(`CREATE DATABASE "${TEST_DB_NAME}";`);
    await bootstrapPrisma.$disconnect();

    // 2. Push schema into temporary database
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      cwd: path.resolve(__dirname, '..', '..'),
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

    // 4. Instantiate service
    service = new ActiveListingsLimitService();

    // 5. Seed test users
    await prisma.user.createMany({
      data: [
        {
          id: TEST_USER_ID,
          username: 'test-publish-rate-user-1',
          email: 'publish-rate-user@example.com',
          phoneE164: '+96891231111',
          role: 'USER',
        },
        {
          id: ADMIN_USER_ID,
          username: 'test-publish-rate-admin-1',
          email: 'publish-rate-admin@example.com',
          phoneE164: '+96891231112',
          role: 'ADMIN',
        },
      ],
    });
  }, 45000);

  afterAll(async () => {
    process.env = originalEnv;
    if (prisma) {
      await prisma.$disconnect();
    }
    try {
      const cleanupPrisma = new PrismaClient({
        datasources: { db: { url: BASE_URL } },
      });
      await cleanupPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}" WITH (FORCE);`);
      await cleanupPrisma.$disconnect();
    } catch {
      // ignore cleanup errors
    }
  });

  beforeEach(async () => {
    await prisma.listing.deleteMany({ where: { sellerId: { in: [TEST_USER_ID, ADMIN_USER_ID] } } });
  });

  it('Test 1 (Concurrency at Daily Cap): N concurrent publishes for one user yield exactly the cap (5), remainder fail with 429 TooManyRequests', async () => {
    // Set daily cap override to 5
    process.env.MAX_DAILY_PUBLISHES_PER_SECTION = '5';
    expect(service.getMaxDailyPublishes()).toBe(5);

    const CONCURRENT_REQUESTS = 10;
    const tasks = Array.from({ length: CONCURRENT_REQUESTS }).map((_, i) =>
      prisma.$transaction(async (tx) => {
        await service.assertWithinLimit(TEST_USER_ID, tx, 'cars');
        return tx.listing.create({
          data: {
            title: `Car Listing ${i + 1}`,
            slug: `car-${i + 1}-${Date.now()}-${Math.random()}`,
            description: `Car Description ${i + 1}`,
            make: 'Toyota',
            model: 'Camry',
            year: 2024,
            price: 12000,
            sellerId: TEST_USER_ID,
            status: 'ACTIVE',
          },
        });
      })
    );

    const results = await Promise.allSettled(tasks);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

    // Exactly 5 must succeed
    expect(fulfilled).toHaveLength(5);

    // Remaining 5 must fail with 429 TooManyRequests
    expect(rejected).toHaveLength(5);
    for (const rej of rejected) {
      const resp = (rej.reason as any)?.getResponse?.() || (rej.reason as any)?.response;
      expect((rej.reason as any)?.getStatus?.() || resp?.statusCode).toBe(429);
      expect(resp?.code).toBe('PUBLISH_RATE_LIMIT_DAILY_REACHED');
      expect(resp?.limit).toBe(5);
      expect(resp?.window).toBe('DAILY');
      expect(resp?.vertical).toBe('cars');
    }

    // Exact count in database must be 5
    const dbCount = await prisma.listing.count({
      where: { sellerId: TEST_USER_ID },
    });
    expect(dbCount).toBe(5);
  }, 35000);

  it('Test 2 (Role Exemption): ADMIN role bypasses publish rate limits -> all 10 concurrent requests succeed', async () => {
    process.env.MAX_DAILY_PUBLISHES_PER_SECTION = '5';

    const tasks = Array.from({ length: 10 }).map((_, i) =>
      prisma.$transaction(async (tx) => {
        await service.assertWithinLimit(ADMIN_USER_ID, tx, 'cars');
        return tx.listing.create({
          data: {
            title: `Admin Car ${i + 1}`,
            slug: `admin-car-${i + 1}-${Date.now()}-${Math.random()}`,
            description: `Admin Car Description ${i + 1}`,
            make: 'Nissan',
            model: 'Patrol',
            year: 2025,
            price: 32000,
            sellerId: ADMIN_USER_ID,
            status: 'ACTIVE',
          },
        });
      })
    );

    const results = await Promise.allSettled(tasks);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    expect(fulfilled).toHaveLength(10);

    const count = await prisma.listing.count({
      where: { sellerId: ADMIN_USER_ID },
    });
    expect(count).toBe(10);
  }, 30000);
});
