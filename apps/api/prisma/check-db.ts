import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Reviewing Database State ---');

  // 1. Check Governorates
  const govs = await prisma.governorate.count();
  console.log(`Governorates count: \${govs}`);

  // 2. Check Wilayas
  const wilayas = await prisma.wilaya.count();
  console.log(`Wilayas count: \${wilayas}`);

  // 3. Check Users Location Migration
  const usersWithGov = await prisma.user.count({
    where: { governorateId: { not: null } }
  });
  const usersTotal = await prisma.user.count();
  console.log(`Users with governorateId: \${usersWithGov} / \${usersTotal}`);

  // 4. Check PostGIS column in DB
  const columns: any[] = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'location';
  `;
  console.log('Users table location column:', columns);

  // 5. Check GIST Index in DB
  const indexes: any[] = await prisma.$queryRaw`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'users_location_idx';
  `;
  console.log('Users table location index:', indexes);

}

main().catch(console.error).finally(() => prisma.$disconnect());
