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
    SELECT table_name, column_name, is_nullable
    FROM information_schema.columns
    WHERE column_name IN ('governorateId', 'wilayaId', 'fromGovernorateId', 'toGovernorateId')
      AND table_schema = 'public'
    ORDER BY table_name, column_name;
  `);
  console.table(result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
