import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') });

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function makeSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  const dataPath = path.resolve(__dirname, '../../../../../cars_master_data_v8.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(raw);

  const brands: any[] = data.brands;
  console.log(`\n🚗 بدء import الداتا: ${brands.length} brand\n`);

  // حذف الداتا القديمة بالترتيب الصح
  console.log('🗑️  حذف الداتا القديمة...');
  await prisma.carTrim.deleteMany({});
  await prisma.carYear.deleteMany({});
  await prisma.carModel.deleteMany({});
  await prisma.brand.deleteMany({});
  console.log('✅ تم حذف الداتا القديمة\n');

  let totalModels = 0;
  let totalTrims = 0;

  for (let bi = 0; bi < brands.length; bi++) {
    const b = brands[bi];
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

    for (const m of models) {
      const modelSlug = makeSlug(`${brandSlug}-${m.name_en}`);

      // جمع كل السنوات من كل الـ generations
      const allYears = new Set<number>();
      for (const gen of (m.generations || [])) {
        for (const y of (gen.years || [])) {
          allYears.add(y);
        }
      }

      // جمع كل الـ trims من كل الـ generations
      const allTrims: Array<{
        name: string; slug: string; yearFrom: number; yearTo: number;
        trimCode: string | null; engineCapacity: string | null; cylinders: number | null;
        horsepower: number | null; torque: string | null; driveType: string | null;
        transmission: string | null; fuelType: string | null; seats: number | null;
        isFullOption: boolean;
      }> = [];

      for (const gen of (m.generations || [])) {
        const yearFrom: number = gen.years_from;
        const yearTo:   number = gen.years_to;

        for (const t of (gen.trims || [])) {
          const trimName = t.display_name || t.trim_code || '';
          if (!trimName) continue;
          const trimSlug = makeSlug(`${modelSlug}-${trimName}-${yearFrom}`);
          const specs = t.specs || {};

          allTrims.push({
            name:           trimName,
            slug:           trimSlug,
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

      // إزالة duplicates من الـ trims (نفس الاسم لنفس الـ model)
      const seenTrimNames = new Set<string>();
      const uniqueTrims = allTrims.filter((t) => {
        if (seenTrimNames.has(t.name)) return false;
        seenTrimNames.add(t.name);
        return true;
      });

      const carModel = await prisma.carModel.create({
        data: {
          name:     m.name_en,
          nameAr:   m.name_ar || null,
          slug:     modelSlug,
          bodyType: m.body_type || null,
          brandId:  brand.id,
          years: {
            create: Array.from(allYears).map((y) => ({ year: y })),
          },
          trims: {
            create: uniqueTrims,
          },
        },
      });

      totalModels++;
      totalTrims += uniqueTrims.length;
      void carModel;
    }

    console.log(`✅ ${bi + 1}/${brands.length}: ${b.name_en} (${models.length} models)`);
  }

  console.log(`\n🎉 تم بنجاح!`);
  console.log(`   Brands: ${brands.length}`);
  console.log(`   Models: ${totalModels}`);
  console.log(`   Trims:  ${totalTrims}`);
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
