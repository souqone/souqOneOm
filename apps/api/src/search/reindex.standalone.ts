/**
 * Standalone reindex script — populates all Meilisearch indexes from PostgreSQL.
 * Usage: npx ts-node -r dotenv/config src/search/reindex.standalone.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function main() {
  // @ts-ignore — ESM-only dynamic import
  const { Meilisearch } = await import('meilisearch');

  const host = process.env.MEILI_HOST || 'http://localhost:7700';
  const apiKey = process.env.MEILI_API_KEY || 'carone_meili_master_key_2024';
  const meili = new Meilisearch({ host, apiKey });

  console.log(`🔗 Meilisearch: ${host}`);
  const health = await meili.health();
  console.log(`✅ Meilisearch status: ${health.status}`);

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
  if (listingDocs.length > 0) await meili.index('listings').addDocuments(listingDocs);
  counts.listings = listingDocs.length;

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
  if (partDocs.length > 0) await meili.index('parts').addDocuments(partDocs);
  counts.parts = partDocs.length;

  // ── Services ──
  const services = await prisma.carService.findMany({
    where: { status: 'ACTIVE' },
    include: { images: { take: 1, orderBy: { order: 'asc' } } },
  });
  const serviceDocs = services.map(s => serialize({
    id: s.id, title: s.title, slug: s.slug, description: s.description,
    serviceType: s.serviceType, providerName: s.providerName, providerType: s.providerType,
    priceFrom: s.priceFrom ? Number(s.priceFrom) : null, currency: s.currency,
    governorate: s.governorate, city: s.city, isHomeService: s.isHomeService,
    status: s.status, imageUrl: s.images[0]?.url || null, createdAt: s.createdAt,
  }));
  if (serviceDocs.length > 0) await meili.index('services').addDocuments(serviceDocs);
  counts.services = serviceDocs.length;

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
  if (jobDocs.length > 0) await meili.index('jobs').addDocuments(jobDocs);
  counts.jobs = jobDocs.length;

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
  if (busDocs.length > 0) await meili.index('buses').addDocuments(busDocs);
  counts.buses = busDocs.length;

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
  if (equipmentDocs.length > 0) await meili.index('equipment').addDocuments(equipmentDocs);
  counts.equipment = equipmentDocs.length;

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
  if (operatorDocs.length > 0) await meili.index('operators').addDocuments(operatorDocs);
  counts.operators = operatorDocs.length;

  console.log('🔄 Reindex complete:', counts);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ Reindex failed:', err);
  process.exit(1);
});
