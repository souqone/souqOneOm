import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { ENTITY_TYPES } from '../../src/common/constants/entity-types.constants';

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
  console.log('STEP 2: CLEANUP OF OPERATOR_LISTING DUPLICATES');
  console.log('Database URL configured:', !!process.env.DATABASE_URL);
  console.log('====================================================\n');

  // 1. Initial count check
  const countBefore = await prisma.operatorListing.count();
  console.log(`[BEFORE] Total OperatorListing rows in DB: ${countBefore}`);

  // 2. Identify duplicate users
  const duplicateUsers: { userId: string; cnt: string }[] = await prisma.$queryRawUnsafe(`
    SELECT "userId", COUNT(*)::text as cnt
    FROM "operator_listings"
    GROUP BY "userId"
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC;
  `);

  console.log(`[AUDIT] Found ${duplicateUsers.length} user(s) with duplicate OperatorListing rows:`);
  console.table(duplicateUsers);

  if (duplicateUsers.length === 0) {
    console.log('[CLEANUP] No duplicates found. Exiting without modifications.');
    return;
  }

  const cleanupReport: {
    userId: string;
    kept: { id: string; title: string; createdAt: Date };
    deleted: { id: string; title: string; createdAt: Date }[];
  }[] = [];

  // 3. Process each affected user inside a single $transaction per user
  for (const dup of duplicateUsers) {
    const userId = dup.userId;
    console.log(`\n----------------------------------------------------`);
    console.log(`Processing duplicates for userId: ${userId} (Count: ${dup.cnt})`);

    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Fetch user's listings ordered by createdAt DESC
        const listings = await tx.operatorListing.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        if (listings.length <= 1) {
          console.log(`User ${userId} has <= 1 listings during transaction, skipping.`);
          return null;
        }

        const [keptListing, ...duplicatesToDelete] = listings;
        const duplicateIds = duplicatesToDelete.map((d) => d.id);

        console.log(`  -> KEEPING newest listing: ID=${keptListing.id} | Title="${keptListing.title}" | CreatedAt=${keptListing.createdAt.toISOString()}`);
        for (const dupListing of duplicatesToDelete) {
          console.log(`  -> MARKED TO DELETE: ID=${dupListing.id} | Title="${dupListing.title}" | CreatedAt=${dupListing.createdAt.toISOString()}`);
        }

        // 3a & 3b. Create outbox DELETE events in batch
        await tx.outboxEvent.createMany({
          data: duplicateIds.map((id) => ({
            entityType: ENTITY_TYPES.OPERATOR_LISTING,
            entityId: id,
            action: 'DELETE',
          })),
        });
        console.log(`  -> Created ${duplicateIds.length} outbox DELETE events.`);

        // 3c. Clean up polymorphic orphans (Favorites, Conversations, Reviews)
        const favs = await tx.favorite.deleteMany({
          where: {
            entityType: ENTITY_TYPES.OPERATOR_LISTING,
            entityId: { in: duplicateIds },
          },
        });

        const convs = await tx.conversation.deleteMany({
          where: {
            entityType: ENTITY_TYPES.OPERATOR_LISTING,
            entityId: { in: duplicateIds },
          },
        });

        const revs = await tx.review.deleteMany({
          where: {
            entityType: 'OPERATOR_LISTING',
            entityId: { in: duplicateIds },
          },
        });

        console.log(`  -> Cleaned polymorphic orphans: Favorites=${favs.count}, Conversations=${convs.count}, Reviews=${revs.count}`);

        // 3d. Delete each duplicate OperatorListing
        for (const id of duplicateIds) {
          await tx.operatorListing.delete({ where: { id } });
        }
        console.log(`  -> Successfully deleted ${duplicateIds.length} duplicate OperatorListing row(s).`);

        return {
          userId,
          kept: {
            id: keptListing.id,
            title: keptListing.title,
            createdAt: keptListing.createdAt,
          },
          deleted: duplicatesToDelete.map((d) => ({
            id: d.id,
            title: d.title,
            createdAt: d.createdAt,
          })),
        };
      },
      {
        maxWait: 15000,
        timeout: 45000,
      },
    );

    if (result) {
      cleanupReport.push(result);
    }
  }

  // 4. Verification queries
  console.log(`\n====================================================`);
  console.log('VERIFICATION AFTER CLEANUP');
  console.log('====================================================');

  const countAfter = await prisma.operatorListing.count();
  console.log(`[AFTER] Total OperatorListing rows in DB: ${countAfter} (Before: ${countBefore})`);
  console.log(`[AFTER] Total rows deleted: ${countBefore - countAfter}`);

  console.log('\n[AFTER] Checking duplicate user query again:');
  const duplicatesAfter: any = await prisma.$queryRawUnsafe(`
    SELECT "userId", COUNT(*)::text as cnt
    FROM "operator_listings"
    GROUP BY "userId"
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC;
  `);
  console.log('Duplicates query result (raw JSON):', safeJson(duplicatesAfter));
  console.table(duplicatesAfter);

  console.log('\n[AFTER] All remaining OperatorListing rows:');
  const remainingListings = await prisma.operatorListing.findMany({
    select: {
      id: true,
      userId: true,
      title: true,
      createdAt: true,
      status: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  console.table(remainingListings);

  console.log('\n--- CLEANUP SUMMARY REPORT ---');
  console.log(safeJson(cleanupReport));
  console.log('\n====================================================');
  console.log('STEP 2 CLEANUP COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

main()
  .catch((err) => {
    console.error('Fatal error during cleanup script:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
