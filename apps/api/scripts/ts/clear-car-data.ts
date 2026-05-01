/**
 * Clear existing car data before seeding new dataset
 * Usage: npx ts-node clear-car-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing existing car data...\n');
  
  const start = Date.now();
  
  // Delete in order to respect foreign key constraints
  const yearCount = await prisma.carYear.count();
  const modelCount = await prisma.carModel.count();
  const brandCount = await prisma.brand.count();
  
  console.log(`📊 Current data:`);
  console.log(`   • Brands: ${brandCount}`);
  console.log(`   • Models: ${modelCount}`);
  console.log(`   • Years: ${yearCount}`);
  
  await prisma.carYear.deleteMany({});
  await prisma.carModel.deleteMany({});
  await prisma.brand.deleteMany({});
  
  const duration = Date.now() - start;
  
  console.log(`\n✅ All car data cleared!`);
  console.log(`⏱️  Duration: ${duration}ms`);
}

main()
  .catch((e) => {
    console.error('❌ Error during clearing:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
