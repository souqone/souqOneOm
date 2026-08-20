const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '../../.env.production' });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  const result = await prisma.$queryRawUnsafe(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'car_services';
  `);
  console.table(result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
