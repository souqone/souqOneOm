/**
 * Standalone reindex script — populates all Meilisearch indexes from PostgreSQL.
 * Usage: npx ts-node -r dotenv/config src/search/reindex.standalone.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { buildSynonymsMap } from './synonyms';

const prisma = new PrismaClient();

const INDEX_CONFIGS: Record<string, { searchableAttributes: string[]; filterableAttributes: string[]; sortableAttributes: string[] }> = {
  listings: {
    searchableAttributes: ['title', 'description', 'make', 'model'],
    filterableAttributes: ['price', 'make', 'model', 'year', 'fuelType', 'transmission', 'condition', 'governorateId', 'wilayaId', 'listingType', 'status', 'isPremium'],
    sortableAttributes: ['price', 'createdAt', 'year', 'mileage', 'viewCount'],
  },
  parts: {
    searchableAttributes: ['title', 'description', 'partNumber', 'compatibleMakes'],
    filterableAttributes: ['price', 'partCategory', 'condition', 'governorateId', 'wilayaId', 'status', 'isOriginal', 'hasWarranty', 'compatibleVehicleTypes'],
    sortableAttributes: ['price', 'createdAt'],
  },
  services: {
    searchableAttributes: ['title', 'description', 'providerName'],
    filterableAttributes: ['serviceType', 'providerType', 'governorateId', 'wilayaId', 'status', 'isHomeService'],
    sortableAttributes: ['priceFrom', 'createdAt'],
  },
  jobs: {
    searchableAttributes: ['title', 'description'],
    filterableAttributes: ['jobType', 'employmentType', 'governorateId', 'wilayaId', 'status', 'salary'],
    sortableAttributes: ['salary', 'createdAt', 'viewCount', 'experienceYears'],
  },
  buses: {
    searchableAttributes: ['title', 'description', 'make', 'model'],
    filterableAttributes: ['price', 'busListingType', 'busType', 'make', 'governorateId', 'wilayaId', 'status', 'capacity', 'isPremium'],
    sortableAttributes: ['price', 'createdAt', 'viewCount', 'capacity'],
  },
  equipment: {
    searchableAttributes: ['title', 'description', 'make', 'model'],
    filterableAttributes: ['price', 'dailyPrice', 'equipmentType', 'listingType', 'condition', 'governorateId', 'wilayaId', 'status', 'isPremium'],
    sortableAttributes: ['price', 'dailyPrice', 'createdAt', 'viewCount'],
  },
  operators: {
    searchableAttributes: ['title', 'description'],
    filterableAttributes: ['operatorType', 'governorateId', 'wilayaId', 'status', 'dailyRate', 'hourlyRate'],
    sortableAttributes: ['dailyRate', 'hourlyRate', 'createdAt', 'viewCount'],
  },
};

function serialize(doc: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (value === undefined || value === null) {
      result[key] = null;
    } else if (typeof value === 'object' && 'toNumber' in (value as any)) {
      result[key] = (value as any).toNumber();
    } else if (value instanceof Date) {
      result[key] = value.getTime();
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function retry<T>(fn: () => Promise<T>, retries = 4, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise(r => setTimeout(r, delay));
    return retry(fn, retries - 1, delay * 1.5);
  }
}

async function prepareAndSyncIndex(meili: any, indexName: string, docs: any[], synonyms: Record<string, string[]>) {
  try {
    await meili.createIndex(indexName, { primaryKey: 'id' });
  } catch {
    // Already created
  }
  const index = meili.index(indexName);
  const cfg = INDEX_CONFIGS[indexName];
  if (cfg) {
    await retry(() => index.updateFilterableAttributes(cfg.filterableAttributes));
    await retry(() => index.updateSortableAttributes(cfg.sortableAttributes));
    await retry(() => index.updateSearchableAttributes(cfg.searchableAttributes));
  }
  if (synonyms && Object.keys(synonyms).length > 0) {
    await retry(() => index.updateSynonyms(synonyms));
  }
  if (docs.length > 0) {
    const task = await retry<any>(() => index.addDocuments(docs, { primaryKey: 'id' }));
    console.log(`  📦 Enqueued ${docs.length} docs for [${indexName}], task: ${task?.taskUid}`);
  }
  return docs.length;
}

async function main() {
  // @ts-ignore — ESM-only dynamic import
  const { Meilisearch } = await import('meilisearch');

  const host = process.env.MEILI_HOST || 'http://localhost:7700';
  const apiKey = process.env.MEILI_API_KEY || process.env.MEILI_MASTER_KEY || 'carone_meili_master_key_2024';
  const meili = new Meilisearch({ host, apiKey });

  console.log(`🔗 Meilisearch: ${host}`);
  const health = await meili.health();
  console.log(`✅ Meilisearch status: ${health.status}`);

  const synonyms = buildSynonymsMap();
  const counts: Record<string, number> = {};

  // ── Listings ──
  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE' },
    include: { images: { take: 1, orderBy: { order: 'asc' } } },
  });
  const listingDocs = listings.map(l => serialize({
    id: l.id, title: l.title, slug: l.slug, description: l.description,
    make: l.make, model: l.model, year: l.year, price: Number(l.price),
    currency: l.currency, mileage: l.mileage, fuelType: l.fuelType,
    transmission: l.transmission, condition: l.condition, listingType: l.listingType,
    governorate: l.governorate, city: l.city, isPremium: l.isPremium,
    status: l.status, viewCount: l.viewCount,
    imageUrl: l.images[0]?.url || null, createdAt: l.createdAt,
  }));
  counts.listings = await prepareAndSyncIndex(meili, 'listings', listingDocs, synonyms);

  // ── Parts ──
  const parts = await prisma.sparePart.findMany({
    where: { status: 'ACTIVE' },
    include: { images: { take: 1, orderBy: { order: 'asc' } } },
  });
  const partDocs = parts.map(p => serialize({
    id: p.id, title: p.title, slug: p.slug, description: p.description,
    partCategory: p.partCategory, condition: p.condition, partNumber: p.partNumber,
    compatibleMakes: p.compatibleMakes, price: Number(p.price), currency: p.currency,
    isOriginal: p.isOriginal, governorate: p.governorate, city: p.city,
    status: p.status, imageUrl: p.images[0]?.url || null, createdAt: p.createdAt,
  }));
  counts.parts = await prepareAndSyncIndex(meili, 'parts', partDocs, synonyms);

  // ── Services ──
  const services = await prisma.carService.findMany({
    where: { status: 'ACTIVE' },
    include: { images: { take: 1, orderBy: { order: 'asc' } } },
  });
  const serviceDocs = services.map(s => serialize({
    id: s.id, title: s.title, slug: s.slug, description: s.description,
    serviceType: s.serviceType, providerName: s.providerName, providerType: s.providerType,
    priceFrom: s.priceFrom ? Number(s.priceFrom) : null, currency: s.currency,
    governorateId: s.governorateId, wilayaId: s.wilayaId, isHomeService: s.isHomeService,
    status: s.status, imageUrl: s.images[0]?.url || null, createdAt: s.createdAt,
  }));
  counts.services = await prepareAndSyncIndex(meili, 'services', serviceDocs, synonyms);

  // ── Jobs ──
  const jobs = await prisma.driverJob.findMany({
    where: { status: 'ACTIVE' },
  });
  const jobDocs = jobs.map(j => serialize({
    id: j.id, title: j.title, slug: j.slug, description: j.description,
    jobType: j.jobType, employmentType: j.employmentType,
    salary: j.salary ? Number(j.salary) : null, salaryPeriod: j.salaryPeriod,
    currency: j.currency, governorateId: j.governorateId, wilayaId: j.wilayaId,
    status: j.status, viewCount: j.viewCount, createdAt: j.createdAt,
  }));
  counts.jobs = await prepareAndSyncIndex(meili, 'jobs', jobDocs, synonyms);

  // ── Buses ──
  const buses = await prisma.busListing.findMany({
    where: { status: 'ACTIVE', deletedAt: null },
    include: { images: { take: 1, orderBy: { order: 'asc' } } },
  });
  const busDocs = buses.map(b => serialize({
    id: b.id, title: b.title, slug: b.slug, description: b.description,
    busListingType: b.busListingType, busType: b.busType,
    make: b.make, model: b.model, year: b.year, capacity: b.capacity,
    price: b.price ? Number(b.price) : null, currency: b.currency,
    isPremium: b.isPremium, governorateId: b.governorateId, wilayaId: b.wilayaId,
    status: b.status, viewCount: b.viewCount, imageUrl: b.images[0]?.url || null,
    createdAt: b.createdAt,
  }));
  counts.buses = await prepareAndSyncIndex(meili, 'buses', busDocs, synonyms);

  // ── Equipment ──
  const equipment = await prisma.equipmentListing.findMany({
    where: { status: 'ACTIVE' },
    include: { images: { take: 1, orderBy: { order: 'asc' } } },
  });
  const equipmentDocs = equipment.map(e => serialize({
    id: e.id, title: e.title, slug: e.slug, description: e.description,
    equipmentType: e.equipmentType, listingType: e.listingType,
    make: e.make, model: e.model, condition: e.condition,
    price: e.price ? Number(e.price) : null, dailyPrice: e.dailyPrice ? Number(e.dailyPrice) : null,
    currency: e.currency, isPremium: e.isPremium, governorateId: e.governorateId, wilayaId: e.wilayaId,
    status: e.status, viewCount: e.viewCount, imageUrl: e.images[0]?.url || null,
    createdAt: e.createdAt,
  }));
  counts.equipment = await prepareAndSyncIndex(meili, 'equipment', equipmentDocs, synonyms);

  // ── Operators ──
  const operators = await prisma.operatorListing.findMany({
    where: { status: 'ACTIVE' },
  });
  const operatorDocs = operators.map(o => serialize({
    id: o.id, title: o.title, slug: o.slug, description: o.description,
    operatorType: o.operatorType, dailyRate: o.dailyRate ? Number(o.dailyRate) : null,
    hourlyRate: o.hourlyRate ? Number(o.hourlyRate) : null, currency: o.currency,
    governorateId: o.governorateId, wilayaId: o.wilayaId, status: o.status,
    viewCount: o.viewCount, createdAt: o.createdAt,
  }));
  counts.operators = await prepareAndSyncIndex(meili, 'operators', operatorDocs, synonyms);

  console.log('🔄 Reindex enqueued complete:', counts);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ Reindex failed:', err);
  process.exit(1);
});
