/**
 * Seed script — Gulf/Oman car market data
 * Hierarchy: Brand → CarModel → CarTrim (with yearFrom/yearTo)
 * Usage: npx ts-node src/cars/seed-cars.ts
 */
import { PrismaClient } from '@prisma/client';
import { GULF_BRANDS } from './data/seed-gulf-v1';

const prisma = new PrismaClient();

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function main() {
  console.log('🚗 Seeding Gulf/Oman car data...\n');
  const start = Date.now();

  // ── Step 1: Clear old data ──
  console.log('🗑️  Clearing existing data...');
  await prisma.$transaction([
    prisma.carTrim.deleteMany(),
    prisma.carYear.deleteMany(),
    prisma.carModel.deleteMany(),
    prisma.brand.deleteMany(),
  ]);
  console.log('   ✓ Old data cleared\n');

  let totalModels = 0;
  let totalTrims  = 0;

  // ── Step 2: Seed brands ──
  for (const seedBrand of GULF_BRANDS) {
    const brand = await prisma.brand.create({
      data: {
        name:      seedBrand.name,
        nameAr:    seedBrand.nameAr,
        slug:      seedBrand.slug,
        isPopular: seedBrand.isPopular,
      },
    });

    // ── Step 3: Seed models for this brand ──
    for (const seedModel of seedBrand.models) {
      const model = await prisma.carModel.create({
        data: {
          name:    seedModel.name,
          nameAr:  seedModel.nameAr,
          slug:    toSlug(seedModel.name),
          brandId: brand.id,
        },
      });
      totalModels++;

      // ── Step 4: Bulk-create trims for this model ──
      if (seedModel.trims.length > 0) {
        await prisma.carTrim.createMany({
          data: seedModel.trims.map((t) => ({
            name:     t.name,
            nameAr:   t.nameAr ?? t.name,
            slug:     toSlug(t.name),
            yearFrom: t.from,
            yearTo:   t.to ?? 2026,
            modelId:  model.id,
          })),
          skipDuplicates: true,
        });
        totalTrims += seedModel.trims.length;
      }
    }

    console.log(`   ✓ ${seedBrand.nameAr} (${seedBrand.name}) — ${seedBrand.models.length} models`);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ Done in ${elapsed}s`);
  console.log(`   Brands : ${GULF_BRANDS.length}`);
  console.log(`   Models : ${totalModels}`);
  console.log(`   Trims  : ${totalTrims}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
