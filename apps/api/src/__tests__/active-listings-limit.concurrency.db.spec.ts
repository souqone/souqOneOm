import { execSync } from 'child_process';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { ActiveListingsLimitService } from '../common/services/active-listings-limit.service';

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

  const TEST_DB_NAME = 'concurrency_active_ads_cap_test_db';
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

describeOrSkip('Active Listings Cap Real PostgreSQL Concurrency (127.0.0.1)', () => {
  const { testDbName: TEST_DB_NAME, baseUrl: BASE_URL, testDbUrl: TEST_DB_URL } = dbConfig || {
    testDbName: 'concurrency_active_ads_cap_test_db',
    baseUrl: '',
    testDbUrl: '',
  };

  let prisma: PrismaClient;
  let service: ActiveListingsLimitService;
  const originalEnv = { ...process.env };
  const TEST_USER_ID = 'test-cap-user-concurrency-1';
  const ADMIN_USER_ID = 'test-cap-admin-concurrency-1';

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
          email: 'user-cap@example.com',
          phoneE164: '+96891230001',
          role: 'USER',
        },
        {
          id: ADMIN_USER_ID,
          email: 'admin-cap@example.com',
          phoneE164: '+96891230002',
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
    const teardownPrisma = new PrismaClient({
      datasources: { db: { url: BASE_URL } },
    });
    await teardownPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}" WITH (FORCE);`);
    await teardownPrisma.$disconnect();
  }, 30000);

  beforeEach(async () => {
    process.env = { ...originalEnv };
    process.env.MAX_ACTIVE_LISTINGS_PER_USER = '5';
    // Clean up listing tables between tests
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "listings",
        "bus_listings",
        "equipment_listings",
        "spare_parts",
        "car_services",
        "driver_jobs",
        "operator_listings"
      CASCADE;
    `);
  });

  it('Test (A): 10 concurrent creations for a regular user with cap=5 -> exactly 5 succeed, exactly 5 fail with ACTIVE_LISTINGS_LIMIT_REACHED (403), exactly 5 active listings exist in DB', async () => {
    process.env.MAX_ACTIVE_LISTINGS_PER_USER = '5';

    // Launch 10 concurrent transactions that call assertWithinLimit and then write to DB inside same tx
    const tasks = Array.from({ length: 10 }).map((_, i) =>
      prisma.$transaction(async (tx) => {
        await service.assertWithinLimit(TEST_USER_ID, tx);
        return tx.listing.create({
          data: {
            title: `Car Listing ${i + 1}`,
            slug: `car-listing-${i + 1}-${Date.now()}-${Math.random()}`,
            description: `Description ${i + 1}`,
            make: 'Toyota',
            model: 'Corolla',
            year: 2022,
            price: 5000,
            sellerId: TEST_USER_ID,
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
          },
        });
      }),
    );

    const results = await Promise.allSettled(tasks);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(5);
    expect(rejected).toHaveLength(5);

    for (const r of rejected) {
      const reason = (r as PromiseRejectedResult).reason;
      expect(reason?.response?.code || reason?.code).toBe('ACTIVE_LISTINGS_LIMIT_REACHED');
      expect(reason?.status || reason?.statusCode).toBe(403);
    }

    // Verify DB count
    const totalCount = await prisma.listing.count({
      where: { sellerId: TEST_USER_ID, status: 'ACTIVE' },
    });
    expect(totalCount).toBe(5);
  }, 30000);

  it('Test (B): 10 concurrent creations across MULTIPLE verticals for same user with cap=5 -> serialized by advisory lock, exactly 5 succeed total across verticals', async () => {
    process.env.MAX_ACTIVE_LISTINGS_PER_USER = '5';

    // We dispatch 10 transactions spanning cars, buses, parts, services, and jobs
    const verticalTasks = [
      // 1. Car
      prisma.$transaction(async (tx) => {
        await service.assertWithinLimit(TEST_USER_ID, tx);
        return tx.listing.create({
          data: {
            title: 'Car A',
            slug: `car-a-${Date.now()}`,
            description: 'Car A desc',
            make: 'Toyota',
            model: 'Camry',
            year: 2023,
            price: 8000,
            sellerId: TEST_USER_ID,
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
          },
        });
      }),
      // 2. Bus
      prisma.$transaction(async (tx) => {
        await service.assertWithinLimit(TEST_USER_ID, tx);
        return tx.busListing.create({
          data: {
            title: 'Bus B',
            slug: `bus-b-${Date.now()}`,
            description: 'Bus B desc',
            busListingType: 'BUS_SALE',
            busType: 'COASTER',
            make: 'Toyota',
            model: 'Coaster',
            year: 2021,
            capacity: 30,
            userId: TEST_USER_ID,
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
          },
        });
      }),
      // 3. Equipment
      prisma.$transaction(async (tx) => {
        await service.assertWithinLimit(TEST_USER_ID, tx);
        return tx.equipmentListing.create({
          data: {
            title: 'Equipment C',
            slug: `equip-c-${Date.now()}`,
            description: 'Equip C desc',
            equipmentType: 'CRANE',
            listingType: 'EQUIPMENT_SALE',
            userId: TEST_USER_ID,
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
          },
        });
      }),
      // 4. Spare Part
      prisma.$transaction(async (tx) => {
        await service.assertWithinLimit(TEST_USER_ID, tx);
        return tx.sparePart.create({
          data: {
            title: 'Part D',
            slug: `part-d-${Date.now()}`,
            description: 'Part D desc',
            partCategory: 'ENGINE',
            price: 200,
            sellerId: TEST_USER_ID,
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
          },
        });
      }),
      // 5. Car Service
      prisma.$transaction(async (tx) => {
        await service.assertWithinLimit(TEST_USER_ID, tx);
        return tx.carService.create({
          data: {
            title: 'Service E',
            slug: `svc-e-${Date.now()}`,
            description: 'Service E desc',
            serviceType: 'OIL_CHANGE',
            providerType: 'GARAGE',
            providerName: 'Garage E',
            userId: TEST_USER_ID,
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
          },
        });
      }),
      // 6. Driver Job
      prisma.$transaction(async (tx) => {
        await service.assertWithinLimit(TEST_USER_ID, tx);
        return tx.driverJob.create({
          data: {
            title: 'Job F',
            slug: `job-f-${Date.now()}`,
            description: 'Job F desc',
            jobType: 'HIRING',
            employmentType: 'FULL_TIME',
            userId: TEST_USER_ID,
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
          },
        });
      }),
      // 7. Operator Listing
      prisma.$transaction(async (tx) => {
        await service.assertWithinLimit(TEST_USER_ID, tx);
        return tx.operatorListing.create({
          data: {
            title: 'Operator G',
            slug: `op-g-${Date.now()}`,
            description: 'Operator G desc',
            operatorType: 'HEAVY_EQUIPMENT',
            wilayaId: 1,
            userId: TEST_USER_ID,
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
          },
        });
      }),
      // 8. Another Car
      prisma.$transaction(async (tx) => {
        await service.assertWithinLimit(TEST_USER_ID, tx);
        return tx.listing.create({
          data: {
            title: 'Car H',
            slug: `car-h-${Date.now()}`,
            description: 'Car H desc',
            make: 'Nissan',
            model: 'Patrol',
            year: 2024,
            price: 25000,
            sellerId: TEST_USER_ID,
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
          },
        });
      }),
      // 9. Another Part
      prisma.$transaction(async (tx) => {
        await service.assertWithinLimit(TEST_USER_ID, tx);
        return tx.sparePart.create({
          data: {
            title: 'Part I',
            slug: `part-i-${Date.now()}`,
            description: 'Part I desc',
            partCategory: 'BRAKES',
            price: 50,
            sellerId: TEST_USER_ID,
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
          },
        });
      }),
      // 10. Another Service
      prisma.$transaction(async (tx) => {
        await service.assertWithinLimit(TEST_USER_ID, tx);
        return tx.carService.create({
          data: {
            title: 'Service J',
            slug: `svc-j-${Date.now()}`,
            description: 'Service J desc',
            serviceType: 'TIRES',
            providerType: 'SHOP',
            providerName: 'Shop J',
            userId: TEST_USER_ID,
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
          },
        });
      }),
    ];

    const results = await Promise.allSettled(verticalTasks);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 5 succeed and exactly 5 are rejected with 403
    expect(fulfilled).toHaveLength(5);
    expect(rejected).toHaveLength(5);

    for (const r of rejected) {
      const reason = (r as PromiseRejectedResult).reason;
      expect(reason?.response?.code || reason?.code).toBe('ACTIVE_LISTINGS_LIMIT_REACHED');
      expect(reason?.status || reason?.statusCode).toBe(403);
    }

    // Verify sum across all verticals in DB is exactly 5
    const [c, b, eq, p, s, j, op] = await Promise.all([
      prisma.listing.count({ where: { sellerId: TEST_USER_ID, status: 'ACTIVE' } }),
      prisma.busListing.count({ where: { userId: TEST_USER_ID, status: 'ACTIVE' } }),
      prisma.equipmentListing.count({ where: { userId: TEST_USER_ID, status: 'ACTIVE' } }),
      prisma.sparePart.count({ where: { sellerId: TEST_USER_ID, status: 'ACTIVE' } }),
      prisma.carService.count({ where: { userId: TEST_USER_ID, status: 'ACTIVE' } }),
      prisma.driverJob.count({ where: { userId: TEST_USER_ID, status: 'ACTIVE' } }),
      prisma.operatorListing.count({ where: { userId: TEST_USER_ID, status: 'ACTIVE' } }),
    ]);

    expect(c + b + eq + p + s + j + op).toBe(5);
  }, 35000);

  it('Test (C): ADMIN role bypasses cap -> all 10 concurrent requests succeed for admin', async () => {
    process.env.MAX_ACTIVE_LISTINGS_PER_USER = '5';

    const tasks = Array.from({ length: 10 }).map((_, i) =>
      prisma.$transaction(async (tx) => {
        await service.assertWithinLimit(ADMIN_USER_ID, tx);
        return tx.listing.create({
          data: {
            title: `Admin Car ${i + 1}`,
            slug: `admin-car-${i + 1}-${Date.now()}-${Math.random()}`,
            description: `Admin Car Desc ${i + 1}`,
            make: 'Toyota',
            model: 'Land Cruiser',
            year: 2024,
            price: 35000,
            sellerId: ADMIN_USER_ID,
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
          },
        });
      }),
    );

    const results = await Promise.allSettled(tasks);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    expect(fulfilled).toHaveLength(10);

    const totalCount = await prisma.listing.count({
      where: { sellerId: ADMIN_USER_ID, status: 'ACTIVE' },
    });
    expect(totalCount).toBe(10);
  }, 30000);
});
