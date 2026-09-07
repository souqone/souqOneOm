import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env.production') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

function safeJson(data: any) {
  return JSON.stringify(
    data,
    (key, value) => (typeof value === 'bigint' ? value.toString() : value),
    2,
  );
}

async function main() {
  console.log('====================================================');
  console.log('STEP 1: RAW SQL AUDIT ON "OperatorListing" vs "operator_listings"');
  console.log('Database URL configured:', !!process.env.DATABASE_URL);
  console.log('====================================================\n');

  // Attempt 1: Literal "OperatorListing" as requested in prompt
  console.log('--- 1A: Literal Query with "OperatorListing" ---');
  try {
    const res = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "OperatorListing";`);
    console.log('Raw output on "OperatorListing":', safeJson(res));
  } catch (err: any) {
    console.log('Error executing against "OperatorListing":', err.message || err);
    console.log('Reason: In schema.prisma line 1471, model OperatorListing has @@map("operator_listings").');
  }

  // Attempt 1B: Actual PostgreSQL table "operator_listings"
  console.log('\n--- 1B: Query on mapped table "operator_listings" ---');
  const duplicateUsers: any = await prisma.$queryRawUnsafe(`
    SELECT "userId", COUNT(*)::text as cnt
    FROM "operator_listings"
    GROUP BY "userId"
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC;
  `);
  console.log('Query: SELECT "userId", COUNT(*) as cnt FROM "operator_listings" GROUP BY "userId" HAVING COUNT(*) > 1 ORDER BY cnt DESC;');
  console.log('Result (raw JSON):', safeJson(duplicateUsers));
  console.table(duplicateUsers);

  const totalCount: any = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::text FROM "operator_listings";
  `);
  console.log('\nQuery: SELECT COUNT(*) FROM "operator_listings";');
  console.log('Result (raw JSON):', safeJson(totalCount));
  console.table(totalCount);

  const distinctUsers: any = await prisma.$queryRawUnsafe(`
    SELECT COUNT(DISTINCT "userId")::text FROM "operator_listings";
  `);
  console.log('\nQuery: SELECT COUNT(DISTINCT "userId") FROM "operator_listings";');
  console.log('Result (raw JSON):', safeJson(distinctUsers));
  console.table(distinctUsers);

  // Prisma ORM API verification
  console.log('\n--- 1C: Prisma ORM Level Verification ---');
  const ormTotal = await prisma.operatorListing.count();
  console.log('prisma.operatorListing.count():', ormTotal);

  const ormDistinct = await prisma.operatorListing.findMany({
    select: { userId: true },
    distinct: ['userId'],
  });
  console.log('prisma.operatorListing distinct user count:', ormDistinct.length);

  // Per-user query if any duplicates exist
  if (duplicateUsers.length > 0) {
    console.log(`\n--- 1D: Detailed listings for ${duplicateUsers.length} duplicate user(s) ---`);
    for (const row of duplicateUsers) {
      const uid = row.userId;
      console.log(`\nQuery for userId: ${uid}`);
      const userListings: any = await prisma.$queryRawUnsafe(`
        SELECT id, "userId", title, "createdAt"
        FROM "operator_listings"
        WHERE "userId" = '${uid}'
        ORDER BY "createdAt" DESC;
      `);
      console.log(`Raw output for ${uid}:`, safeJson(userListings));
      console.table(userListings);
    }
  } else {
    console.log('\n--- 1D: Duplicate User Details ---');
    console.log('Zero duplicate users found (duplicateUsers.length === 0).');
  }

  console.log('\n====================================================');
  console.log('STEP 1 AUDIT COMPLETED');
  console.log('====================================================');
}

main()
  .catch((err) => {
    console.error('Fatal error during audit:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
