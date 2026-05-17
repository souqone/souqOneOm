import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../.env') });

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({ log: [] });

const SKIP_TRIMS = new Set(['Standard/Base', 'Base', 'Standard']);

function makeSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface CarRecord {
  make_en: string;
  make_ar: string;
  origin_country: string;
  model_en: string;
  model_ar: string;
  trim: string | null;
}

async function run(testMakeOnly?: string) {
  const filePath = path.join(__dirname, 'cars_final_v2.json');
  const raw: CarRecord[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const records = testMakeOnly
    ? raw.filter((r) => r.make_en === testMakeOnly)
    : raw;

  // Group: make_en → model_en → trims[]
  const makes = new Map<string, { make_ar: string; origin_country: string; models: Map<string, { model_ar: string; trims: string[] }> }>();

  for (const row of records) {
    if (!makes.has(row.make_en)) {
      makes.set(row.make_en, { make_ar: row.make_ar, origin_country: row.origin_country, models: new Map() });
    }
    const make = makes.get(row.make_en)!;

    if (!make.models.has(row.model_en)) {
      make.models.set(row.model_en, { model_ar: row.model_ar, trims: [] });
    }
    const model = make.models.get(row.model_en)!;

    if (row.trim && !SKIP_TRIMS.has(row.trim) && !model.trims.includes(row.trim)) {
      model.trims.push(row.trim);
    }
  }

  let totalBrands = 0, totalModels = 0, totalTrims = 0;

  for (const [make_en, makeData] of makes) {
    const brandSlug = makeSlug(make_en);

    const brand = await prisma.brand.upsert({
      where: { name: make_en },
      create: {
        name: make_en,
        nameAr: makeData.make_ar || null,
        slug: brandSlug,
        originCountry: makeData.origin_country || null,
      },
      update: {
        nameAr: makeData.make_ar || null,
        originCountry: makeData.origin_country || null,
      },
    });
    totalBrands++;

    for (const [model_en, modelData] of makeData.models) {
      const modelSlug = makeSlug(model_en);

      const carModel = await prisma.carModel.upsert({
        where: { name_brandId: { name: model_en, brandId: brand.id } },
        create: {
          name: model_en,
          nameAr: modelData.model_ar || null,
          slug: modelSlug,
          brandId: brand.id,
        },
        update: {
          nameAr: modelData.model_ar || null,
        },
      });
      totalModels++;

      for (const trimName of modelData.trims) {
        await prisma.carTrim.upsert({
          where: { name_modelId: { name: trimName, modelId: carModel.id } },
          create: {
            name: trimName,
            slug: makeSlug(trimName),
            trimCode: trimName.toLowerCase().replace(/\s+/g, '_'),
            yearFrom: 2000,
            yearTo: 2030,
            modelId: carModel.id,
          },
          update: {},
        });
        totalTrims++;
      }
    }

    console.log(`✓ ${make_en}: ${makeData.models.size} models, ${[...makeData.models.values()].reduce((a, m) => a + m.trims.length, 0)} trims`);
  }

  console.log('\n─────────────────────────────');
  console.log(`Brands:  ${totalBrands}`);
  console.log(`Models:  ${totalModels}`);
  console.log(`Trims:   ${totalTrims}`);
  console.log('─────────────────────────────');
}

const testArg = process.argv[2]; // e.g. --test=Toyota
const testMake = testArg?.startsWith('--test=') ? testArg.split('=')[1] : undefined;

run(testMake)
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
