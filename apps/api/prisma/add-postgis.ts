import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function addLocationColumn(tableName: string, columnName: string = 'location') {
  try {
    console.log(`Adding ${columnName} to ${tableName}...`);
    // Add column if not exists
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${columnName}" geography(Point, 4326);
    `);
    
    // Create GIST index if not exists
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "${tableName}_${columnName}_idx" ON "${tableName}" USING GIST ("${columnName}");
    `);
    console.log(`✅ Success for ${tableName}`);
  } catch (e: any) {
    console.error(`❌ Error on ${tableName}:`, e.message);
  }
}

async function main() {
  console.log('--- Starting PostGIS SQL Migration ---');

  // Enable PostGIS extension if not exists
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    console.log('✅ PostGIS extension enabled.');
  } catch(e: any) {
    console.log('PostGIS extension might already be enabled or failed:', e.message);
  }

  const tables = [
    'users',
    'listings',
    'driver_jobs',
    'driver_profiles',
    'employer_profiles',
    'spare_parts',
    'car_services',
    'bus_listings',
    'equipment_listings',
    'operator_listings',
    'carrier_profiles'
  ];

  for (const table of tables) {
    await addLocationColumn(table, 'location');
  }

  // Transport requests has two locations
  await addLocationColumn('transport_requests', 'fromLocation');
  await addLocationColumn('transport_requests', 'toLocation');

  console.log('--- Finished PostGIS Migration ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
