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

async function main() {
  console.log('Query: SELECT COUNT(*)::text FROM "operator_listings" WHERE "wilayaId" IS NULL;');
  const result = await prisma.$queryRawUnsafe('SELECT COUNT(*)::text FROM "operator_listings" WHERE "wilayaId" IS NULL;');
  console.log('RAW OUTPUT:', JSON.stringify(result, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
