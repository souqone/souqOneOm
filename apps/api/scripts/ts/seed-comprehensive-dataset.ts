/**
 * Fast seed script — uses createMany + transactions
 * Usage: npx ts-node seed-comprehensive-dataset.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const POPULAR = new Set(['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Nissan',
  'Hyundai', 'Kia', 'Lexus', 'Land Rover', 'Porsche', 'GMC', 'Mitsubishi']);

async function main() {
  console.log('🚗 Seeding comprehensive car dataset (fast mode)...\n');
  const start = Date.now();

  const datasetPath = path.join(__dirname, 'full_car_dataset.json');
  if (!fs.existsSync(datasetPath)) {
    console.error('❌ Dataset not found. Run generate-313-brands.py first.');
    process.exit(1);
  }

  const dataset: any[] = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
  console.log(`📊 Loaded ${dataset.length} records`);

  // Group by brand
  const brandsMap = new Map<string, any[]>();
  for (const rec of dataset) {
    if (!brandsMap.has(rec.brand)) brandsMap.set(rec.brand, []);
    brandsMap.get(rec.brand)!.push(rec);
  }
  console.log(`🏷️  ${brandsMap.size} unique brands\n`);

  // Step 1: Create all brands
  console.log('Step 1/3: Creating brands...');
  const brandEntries = Array.from(brandsMap.keys()).map(name => {
    const rec = dataset.find((r: any) => r.brand === name);
    return {
      name,
      nameAr: rec?.brandAr || name,
      slug: toSlug(name),
      isPopular: POPULAR.has(name),
    };
  });

  await prisma.brand.createMany({ data: brandEntries, skipDuplicates: true });
  console.log(`   ✅ ${brandEntries.length} brands created`);

  // Fetch all brand IDs
  const allBrands = await prisma.brand.findMany({ select: { id: true, name: true } });
  const brandIdMap = new Map(allBrands.map(b => [b.name, b.id]));

  // Step 2: Create all models
  console.log('Step 2/3: Creating models...');
  const modelEntries: { name: string; nameAr: string; slug: string; brandId: string }[] = [];
  for (const [brandName, records] of brandsMap) {
    const brandId = brandIdMap.get(brandName);
    if (!brandId) continue;
    const modelNames = new Set(records.map((r: any) => r.model));
    for (const modelName of modelNames) {
      modelEntries.push({
        name: modelName,
        nameAr: modelName,
        slug: toSlug(modelName),
        brandId,
      });
    }
  }

  await prisma.carModel.createMany({ data: modelEntries, skipDuplicates: true });
  console.log(`   ✅ ${modelEntries.length} models created`);

  // Fetch all model IDs
  const allModels = await prisma.carModel.findMany({ select: { id: true, name: true, brandId: true } });
  const modelIdMap = new Map(allModels.map(m => [`${m.brandId}:${m.name}`, m.id]));

  // Step 3: Create all years in batches
  console.log('Step 3/3: Creating years...');
  const yearEntries: { year: number; modelId: string }[] = [];
  for (const rec of dataset) {
    const brandId = brandIdMap.get(rec.brand);
    if (!brandId) continue;
    const modelId = modelIdMap.get(`${brandId}:${rec.model}`);
    if (!modelId) continue;
    for (const year of rec.years) {
      yearEntries.push({ year, modelId });
    }
  }

  // Batch insert years (1000 at a time)
  const BATCH = 1000;
  for (let i = 0; i < yearEntries.length; i += BATCH) {
    const batch = yearEntries.slice(i, i + BATCH);
    await prisma.carYear.createMany({ data: batch, skipDuplicates: true });
    process.stdout.write(`   📅 ${Math.min(i + BATCH, yearEntries.length)}/${yearEntries.length}\r`);
  }
  console.log(`\n   ✅ ${yearEntries.length} years created`);

  const duration = Date.now() - start;

  // Verify
  const [bc, mc, yc] = await Promise.all([
    prisma.brand.count(),
    prisma.carModel.count(),
    prisma.carYear.count(),
  ]);

  console.log(`\n🎉 Done in ${duration}ms!`);
  console.log(`📋 Database:`);
  console.log(`   • Brands: ${bc}`);
  console.log(`   • Models: ${mc}`);
  console.log(`   • Years:  ${yc}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
