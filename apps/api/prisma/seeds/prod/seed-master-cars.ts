import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') });

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

function makeSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function newClient() {
  return new PrismaClient({ log: [] });
}

async function seedBrand(b: any, bi: number, total: number): Promise<{ models: number; trims: number }> {
  const prisma = newClient();
  try {
    const brandSlug = makeSlug(b.name_en);

    const brand = await prisma.brand.create({
      data: {
        name:          b.name_en,
        nameAr:        b.name_ar || null,
        slug:          brandSlug,
        originCountry: b.origin_country || null,
        isPopular:     false,
      },
    });

    const models: any[] = b.models || [];
    let trimCount = 0;

    for (const m of models) {
      const modelSlug = makeSlug(`${brandSlug}-${m.name_en}`);

      const allYears = new Set<number>();
      for (const gen of (m.generations || [])) {
        for (const y of (gen.years || [])) allYears.add(y);
      }

      const allTrims: any[] = [];
      for (const gen of (m.generations || [])) {
        const yearFrom: number = gen.years_from;
        const yearTo:   number = gen.years_to;
        for (const t of (gen.trims || [])) {
          const trimName = t.display_name || t.trim_code || '';
          if (!trimName) continue;
          const specs = t.specs || {};
          allTrims.push({
            name:           trimName,
            slug:           makeSlug(`${modelSlug}-${trimName}-${yearFrom}`),
            yearFrom,
            yearTo,
            trimCode:       t.trim_code || null,
            engineCapacity: specs.engine_capacity || null,
            cylinders:      specs.cylinders ?? null,
            horsepower:     specs.horsepower ?? null,
            torque:         specs.torque || null,
            driveType:      specs.drive_type || null,
            transmission:   specs.transmission || null,
            fuelType:       specs.fuel_type || null,
            seats:          specs.seating_capacity ?? null,
            isFullOption:   t.is_full_option ?? false,
          });
        }
      }

      const seenNames = new Set<string>();
      const uniqueTrims = allTrims.filter((t) => {
        if (seenNames.has(t.name)) return false;
        seenNames.add(t.name);
        return true;
      });

      await prisma.carModel.create({
        data: {
          name:     m.name_en,
          nameAr:   m.name_ar || null,
          slug:     modelSlug,
          bodyType: m.body_type || null,
          brandId:  brand.id,
          years: { create: Array.from(allYears).map((y) => ({ year: y })) },
          trims: { create: uniqueTrims },
        },
      });

      trimCount += uniqueTrims.length;
    }

    console.log(`✅ ${bi + 1}/${total}: ${b.name_en} (${models.length} models, ${trimCount} trims)`);
    return { models: models.length, trims: trimCount };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const dataPath = path.resolve(__dirname, '../../../../../cars_master_data_v8.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(raw);
  const brands: any[] = data.brands;

  console.log(`\n🚗 بدء import الداتا: ${brands.length} brand\n`);

  // حذف الداتا القديمة
  console.log('🗑️  حذف الداتا القديمة...');
  const prismaClean = newClient();
  await prismaClean.carTrim.deleteMany({});
  await prismaClean.carYear.deleteMany({});
  await prismaClean.carModel.deleteMany({});
  await prismaClean.brand.deleteMany({});
  await prismaClean.$disconnect();
  console.log('✅ تم حذف الداتا القديمة\n');

  let totalModels = 0;
  let totalTrims  = 0;

  // كل brand في connection مستقلة
  for (let bi = 0; bi < brands.length; bi++) {
    const { models, trims } = await seedBrand(brands[bi], bi, brands.length);
    totalModels += models;
    totalTrims  += trims;
  }

  console.log(`\n🎉 تم بنجاح!`);
  console.log(`   Brands: ${brands.length}`);
  console.log(`   Models: ${totalModels}`);
  console.log(`   Trims:  ${totalTrims}`);
}

main().catch((e) => { console.error('❌ Error:', e); process.exit(1); });
