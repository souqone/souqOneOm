import { execSync } from 'child_process';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { ConflictException } from '@nestjs/common';
import { OperatorsService } from '../operators/operators.service';

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

  const TEST_DB_NAME = 'concurrency_operator_unique_test_db';
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

describeOrSkip('Operator Profile Uniqueness Real PostgreSQL Concurrency (D-222)', () => {
  const { testDbName: TEST_DB_NAME, baseUrl: BASE_URL, testDbUrl: TEST_DB_URL } = dbConfig || {
    testDbName: 'concurrency_operator_unique_test_db',
    baseUrl: '',
    testDbUrl: '',
  };

  let prisma: PrismaClient;
  let service: OperatorsService;
  const TEST_USER_ID = 'test-operator-concurrency-user-1';
  let testGovId: number;
  let testWilayaId: number;

  beforeAll(async () => {
    // 1. Create fresh isolated temporary database
    const bootstrapPrisma = new PrismaClient({
      datasources: { db: { url: BASE_URL } },
    });
    await bootstrapPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}" WITH (FORCE);`);
    await bootstrapPrisma.$executeRawUnsafe(`CREATE DATABASE "${TEST_DB_NAME}";`);
    await bootstrapPrisma.$disconnect();

    // 2. Push schema with unique constraint into isolated temporary database
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      cwd: path.resolve(__dirname, '..', '..'),
      env: {
        ...process.env,
        DATABASE_URL: TEST_DB_URL,
      },
      stdio: 'pipe',
    });

    // 3. Connect PrismaClient to isolated database
    prisma = new PrismaClient({
      datasources: { db: { url: TEST_DB_URL } },
    });
    await prisma.$connect();

    // 4. Instantiate OperatorsService with correct constructor injection order
    const mockGeoService = {
      validateLocationPair: jest.fn().mockResolvedValue(true),
    };
    const mockNotificationsService = {
      notify: jest.fn().mockResolvedValue(undefined),
    };
    const mockSellerGate = {
      assertCanPublish: jest.fn().mockResolvedValue(undefined),
    };
    const mockLimitService = {
      assertWithinLimit: jest.fn().mockResolvedValue(undefined),
    };
    const mockViewCounter = {
      recordView: jest.fn(),
    };

    service = new OperatorsService(
      mockGeoService as any,
      prisma as any,
      mockNotificationsService as any,
      mockSellerGate as any,
      mockLimitService as any,
      mockViewCounter as any,
    );

    // 5. Seed test user
    await prisma.user.create({
      data: {
        id: TEST_USER_ID,
        username: 'op-concurrency-user',
        email: 'op-concurrency@example.com',
        phoneE164: '+96891230099',
        role: 'USER',
      },
    });

    // 6. Seed location data
    const gov = await prisma.governorate.create({
      data: {
        nameAr: 'مسقط',
        nameEn: 'Muscat',
        wilayas: {
          create: {
            nameAr: 'السيب',
            nameEn: 'Seeb',
          },
        },
      },
      include: { wilayas: true },
    });
    testGovId = gov.id;
    testWilayaId = gov.wilayas[0].id;
  }, 45000);

  afterAll(async () => {
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
      // ignore cleanup errors on drop
    }
  });

  beforeEach(async () => {
    await prisma.operatorListing.deleteMany({ where: { userId: TEST_USER_ID } });
  });

  it('Test 1 (Concurrency with Unique Constraint): N concurrent creates for the same user yield exactly 1 row, others receive ConflictException (409)', async () => {
    const N = 5;
    const createDto = {
      title: 'مشغل رافعة معتمد',
      description: 'وصف تفصيلي لخبرة المشغل في قيادة الرافعات الثقيلة والمعدات',
      operatorType: 'OPERATOR',
      equipmentTypes: ['CRANE'],
      skills: ['HEAVY_LIFT'],
      experienceYears: 7,
      governorateId: testGovId,
      wilayaId: testWilayaId,
      certifications: ['HEAVY_LICENSE_LEVEL_1'],
      hourlyRate: 15,
      dailyRate: 120,
    };

    // Run N creates concurrently through the service
    const promises = Array.from({ length: N }).map(() =>
      service.create(createDto as any, TEST_USER_ID)
    );

    const results = await Promise.allSettled(promises);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

    // Exactly 1 must succeed
    expect(fulfilled).toHaveLength(1);

    // All others (N - 1) must be rejected with ConflictException (409)
    expect(rejected).toHaveLength(N - 1);
    for (const rej of rejected) {
      expect(rej.reason).toBeInstanceOf(ConflictException);
      expect(rej.reason.message).toBe('لديك بروفايل مشغّل بالفعل، يمكنك تعديله أو طلب حذفه');
    }

    // Verify database has exactly 1 row for this user
    const dbRows = await prisma.operatorListing.findMany({
      where: { userId: TEST_USER_ID },
    });
    expect(dbRows).toHaveLength(1);
    expect(dbRows[0].title).toBe('مشغل رافعة معتمد');
  }, 30000);

  it('Test 2 (Teeth / Revert Proof): without the unique index, concurrent creates can bypass the findFirst precheck and create duplicate rows', async () => {
    // Drop the unique constraint temporarily in the isolated test DB
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "operator_listings_userId_key";`);

    // Intentionally simulate concurrent transactions entering create after passing findFirst simultaneously
    const tasks = [1, 2].map((i) =>
      prisma.$transaction(async (tx) => {
        return tx.operatorListing.create({
          data: {
            userId: TEST_USER_ID,
            title: `Duplicate Operator ${i}`,
            slug: `dup-op-${i}-${Date.now()}-${Math.random()}`,
            description: `وصف تفصيلي للمشغل المكرر رقم ${i} لاختبار القيد`,
            operatorType: 'OPERATOR',
            equipmentTypes: ['CRANE'],
            specializations: ['HEAVY_LIFT'],
            experienceYears: 5,
            governorateId: testGovId,
            wilayaId: testWilayaId,
            certifications: ['HEAVY_LICENSE_LEVEL_1'],
            status: 'ACTIVE',
          },
        });
      })
    );

    await Promise.all(tasks);

    // Verify that WITHOUT the unique constraint, 2 rows were created (proving teeth)
    const count = await prisma.operatorListing.count({
      where: { userId: TEST_USER_ID },
    });
    expect(count).toBe(2);

    // Re-create the unique index to restore DB state
    await prisma.operatorListing.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "operator_listings_userId_key" ON "operator_listings"("userId");`);
  }, 30000);

  it('Test 3 (F1 Migration Atomicity on Duplicates): migration fails when duplicate userId exists without dropping existing index', async () => {
    // 1. Ensure clean slate and create legacy non-unique index
    await prisma.operatorListing.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "operator_listings_userId_key";`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "operator_listings_userId_idx";`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "operator_listings_userId_idx" ON "operator_listings"("userId");`);

    // 2. Insert 2 duplicate rows for TEST_USER_ID
    for (let i = 1; i <= 2; i++) {
      await prisma.operatorListing.create({
        data: {
          userId: TEST_USER_ID,
          title: `Duplicate Operator Row ${i}`,
          slug: `dup-op-migration-${i}-${Date.now()}-${Math.random()}`,
          description: `وصف المشغل المكرر رقم ${i} لاختبار فشل الميغريشن`,
          operatorType: 'OPERATOR',
          equipmentTypes: ['CRANE'],
          specializations: ['HEAVY_LIFT'],
          experienceYears: 5,
          governorateId: testGovId,
          wilayaId: testWilayaId,
          certifications: ['HEAVY_LICENSE_LEVEL_1'],
          status: 'ACTIVE',
        },
      });
    }

    // 3. Attempt to execute the migration statements (reordered: CREATE UNIQUE first, then DROP non-unique)
    // We expect CREATE UNIQUE INDEX to fail due to duplicate rows
    let migrationError: any = null;
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "operator_listings_userId_key" ON "operator_listings"("userId");`);
      await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "operator_listings_userId_idx";`);
    } catch (err) {
      migrationError = err;
    }

    expect(migrationError).not.toBeNull();
    expect(migrationError?.message || '').toContain('23505');
    expect(migrationError?.message || '').toContain('duplicated');

    // 4. Verify existing non-unique index was NOT dropped and still exists in PostgreSQL catalogs
    const existingIndex = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'operator_listings' AND indexname = 'operator_listings_userId_idx';
    `;
    expect(existingIndex).toHaveLength(1);
    expect(existingIndex[0].indexname).toBe('operator_listings_userId_idx');

    // 5. Verify the unique index was NOT created
    const uniqueIndex = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'operator_listings' AND indexname = 'operator_listings_userId_key';
    `;
    expect(uniqueIndex).toHaveLength(0);

    // Clean up
    await prisma.operatorListing.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "operator_listings_userId_idx";`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "operator_listings_userId_key" ON "operator_listings"("userId");`);
  }, 30000);
});
