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
    SELECT event_object_table, trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'car_services';
  `);
  console.table(result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
