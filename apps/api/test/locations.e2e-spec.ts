import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, closeTestApp, getPrisma } from './setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { GeoService } from '../src/locations/geo.service';

describe('Locations & PostGIS (E2E + Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let geoService: GeoService;
  let testUserId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrisma();
    geoService = app.get<GeoService>(GeoService);

    // Create a dedicated test user for live DB integration tests
    const timestamp = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `test-geo-${timestamp}@example.com`,
        username: `testgeo${timestamp}`,
        passwordHash: 'dummy_hash',
        displayName: 'Geo Test User',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup the test user and close app
    if (testUserId && prisma) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await closeTestApp();
  });

  // ══════════════════════════════════════════════
  // Phase 5 — E2E API Tests (LocationsController)
  // ══════════════════════════════════════════════

  describe('Phase 5 — LocationsController Endpoints', () => {
    it('GET /api/locations/governorates — should return list of active governorates', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/locations/governorates')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(11);

      const muscat = res.body.find((g: any) => g.nameEn === 'Muscat');
      expect(muscat).toBeDefined();
      expect(muscat).toMatchObject({
        nameAr: 'مسقط',
        nameEn: 'Muscat',
        isActive: true,
      });
    });

    it('GET /api/locations/wilayas?governorateId=... — should return wilayas for given governorate', async () => {
      // 1. Get Muscat id
      const govRes = await request(app.getHttpServer())
        .get('/api/locations/governorates')
        .expect(200);

      const muscat = govRes.body.find((g: any) => g.nameEn === 'Muscat');
      expect(muscat).toBeDefined();

      // 2. Fetch its wilayas
      const res = await request(app.getHttpServer())
        .get(`/api/locations/wilayas?governorateId=${muscat.id}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(6);

      const seeb = res.body.find((w: any) => w.nameAr === 'السيب');
      expect(seeb).toBeDefined();
      expect(seeb.governorateId).toBe(muscat.id);
    });

    it('GET /api/locations/wilayas — should return 400 if governorateId query param is missing', async () => {
      await request(app.getHttpServer())
        .get('/api/locations/wilayas')
        .expect(400);
    });

    it('GET /api/locations/wilayas?governorateId=abc — should return 400 for non-numeric governorateId', async () => {
      await request(app.getHttpServer())
        .get('/api/locations/wilayas?governorateId=abc')
        .expect(400);
    });

    it('GET /api/locations/wilayas?governorateId=99999 — should return empty array for non-existent governorate', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/locations/wilayas?governorateId=99999')
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  // ══════════════════════════════════════════════
  // Phase 3 — PostGIS Integration Tests on Real DB
  // ══════════════════════════════════════════════

  describe('Phase 3 — PostGIS Live Integration', () => {
    it('Spec 3.0: PostGIS extension is installed and enabled', async () => {
      const result: any[] = await prisma.$queryRawUnsafe(`
        SELECT extname FROM pg_extension WHERE extname = 'postgis';
      `);

      expect(result.length).toBe(1);
      expect(result[0].extname).toBe('postgis');
    });

    it('Spec 3.1 & 3.2: syncLocation() writes point with correct SRID and coordinate precision', async () => {
      const targetLat = 23.588033;
      const targetLng = 58.382872;

      // 1. Sync location to test user
      const synced = await geoService.syncLocation('users', testUserId, targetLat, targetLng);
      expect(synced).toBe(true);

      // 2. Query PostGIS functions directly via raw SQL
      const rows: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          ST_SRID(location::geometry) as srid,
          ST_GeometryType(location::geometry) as geom_type,
          ST_Y(location::geometry) as lat,
          ST_X(location::geometry) as lng
        FROM "users"
        WHERE "id" = '${testUserId}';
      `);

      expect(rows.length).toBe(1);
      const row = rows[0];

      expect(row.srid).toBe(4326);
      expect(row.geom_type).toBe('ST_Point');
      expect(Number(row.lat)).toBeCloseTo(targetLat, 5);
      expect(Number(row.lng)).toBeCloseTo(targetLng, 5);
    });

    it('Spec 3.3: clearLocation() clears PostGIS geography column to NULL', async () => {
      // 1. Clear location
      const cleared = await geoService.clearLocation('users', testUserId);
      expect(cleared).toBe(true);

      // 2. Verify column is NULL using SQL boolean check (avoids Prisma raw geography deserialization)
      const rows: any[] = await prisma.$queryRawUnsafe(`
        SELECT (location IS NULL) as is_null FROM "users" WHERE "id" = '${testUserId}';
      `);

      expect(rows.length).toBe(1);
      expect(rows[0].is_null).toBe(true);
    });

    it('Spec 3.4: syncLocation supports custom column names (fromLocation / toLocation) on live DB', async () => {
      // Create a test transport request
      const req = await prisma.transportRequest.create({
        data: {
          userId: testUserId,
          serviceType: 'GOODS',
          fromGovernorateId: 1,
          fromWilayaId: 1,
          fromAddress: 'Al Khoudh, Street 12',
          toGovernorateId: 2,
          toWilayaId: 7,
          toAddress: 'Al Haffa, Street 5',
          cargoDescription: 'Furniture and electronics',
        },
      });

      try {
        const fromLat = 23.588;
        const fromLng = 58.382;
        const toLat = 17.015;
        const toLng = 54.092;

        // Sync both fromLocation and toLocation
        await geoService.syncLocation('transport_requests', req.id, fromLat, fromLng, 'id', 'fromLocation');
        await geoService.syncLocation('transport_requests', req.id, toLat, toLng, 'id', 'toLocation');

        // Query both geography columns
        const rows: any[] = await prisma.$queryRawUnsafe(`
          SELECT 
            ST_Y("fromLocation"::geometry) as from_lat,
            ST_X("fromLocation"::geometry) as from_lng,
            ST_Y("toLocation"::geometry) as to_lat,
            ST_X("toLocation"::geometry) as to_lng
          FROM "transport_requests"
          WHERE "id" = '${req.id}';
        `);

        expect(rows.length).toBe(1);
        const row = rows[0];

        expect(Number(row.from_lat)).toBeCloseTo(fromLat, 3);
        expect(Number(row.from_lng)).toBeCloseTo(fromLng, 3);
        expect(Number(row.to_lat)).toBeCloseTo(toLat, 3);
        expect(Number(row.to_lng)).toBeCloseTo(toLng, 3);
      } finally {
        await prisma.transportRequest.deleteMany({ where: { id: req.id } });
      }
    });
  });
});
