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

  // ── Transport ──
  const transport = await prisma.transportService.findMany({
    where: { status: 'ACTIVE' },
    include: { images: { take: 1, orderBy: { order: 'asc' } } },
  });
  const transportDocs = transport.map(t => serialize({
    id: t.id, title: t.title, slug: t.slug, description: t.description,
    transportType: t.transportType, providerName: t.providerName, providerType: t.providerType,
    basePrice: t.basePrice ? Number(t.basePrice) : null, currency: t.currency,
    governorate: t.governorate, city: t.city, coverageAreas: t.coverageAreas,
    hasInsurance: t.hasInsurance, hasTracking: t.hasTracking, status: t.status,
    imageUrl: t.images[0]?.url || null, createdAt: t.createdAt,
  }));
  if (transportDocs.length > 0) await meili.index('transport').addDocuments(transportDocs);
  counts.transport = transportDocs.length;

  // ── Trips ──
  const trips = await prisma.tripService.findMany({ where: { status: 'ACTIVE' } });
  const tripDocs = trips.map(t => serialize({
    id: t.id, title: t.title, slug: t.slug, description: t.description,
    tripType: t.tripType, routeFrom: t.routeFrom, routeTo: t.routeTo,
    providerName: t.providerName, scheduleType: t.scheduleType,
    pricePerTrip: t.pricePerTrip ? Number(t.pricePerTrip) : null,
    priceMonthly: t.priceMonthly ? Number(t.priceMonthly) : null,
    currency: t.currency, governorate: t.governorate, city: t.city,
    status: t.status, createdAt: t.createdAt,
  }));
  if (tripDocs.length > 0) await meili.index('trips').addDocuments(tripDocs);
  counts.trips = tripDocs.length;

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

  console.log('🔄 Reindex complete:', counts);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ Reindex failed:', err);
  process.exit(1);
});
