import request from 'supertest';
import { createTestApp, closeTestApp, getApp, getPrisma, registerUser, getTestBrandAndModel, getValidListingPayload } from './setup';
import { PrismaClient } from '@prisma/client';

describe('P1 Specification E2E Test Suite', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    await createTestApp();
    prisma = getPrisma();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // P1.1: Optimistic Concurrency Control (OCC)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('P1.1: Optimistic Concurrency Control (OCC)', () => {
    it('should reject PATCH without version field with 400 Bad Request', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload();
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .patch(`/api/listings/${created.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ price: 9200 })
        .expect(400);

      expect(JSON.stringify(res.body)).toContain('version');
    });

    it('should reject non-numeric version with 400 Bad Request', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload();
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);

      await request(getApp().getHttpServer())
        .patch(`/api/listings/${created.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ price: 9200, version: 'one' })
        .expect(400);
    });

    it('should update listing and increment version by exactly 1 when current version is supplied', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload();
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);

      expect(created.body.version).toBe(1);

      const updateRes = await request(getApp().getHttpServer())
        .patch(`/api/listings/${created.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ price: 9500, version: 1 })
        .expect(200);

      expect(updateRes.body.version).toBe(2);
      expect(Number(updateRes.body.price)).toBe(9500);

      // Verify directly in database
      const inDb = await prisma.listing.findUnique({ where: { id: created.body.id } });
      expect(inDb?.version).toBe(2);
      expect(Number(inDb?.price)).toBe(9500);
    });

    it('should reject update with stale version with 409 Conflict', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload();
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);

      // First update moves version from 1 to 2
      await request(getApp().getHttpServer())
        .patch(`/api/listings/${created.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ price: 9100, version: 1 })
        .expect(200);

      // Second update uses stale version 1 -> 409 Conflict
      const conflictRes = await request(getApp().getHttpServer())
        .patch(`/api/listings/${created.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ price: 9200, version: 1 })
        .expect(409);

      expect(conflictRes.body.message).toBeDefined();
    });

    it('should handle parallel updates with same version: exactly one 200 and one 409', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload();
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);

      const originalVersion = created.body.version; // 1

      // Fire two concurrent requests both trying to mutate from version 1
      const [reqA, reqB] = await Promise.all([
        request(getApp().getHttpServer())
          .patch(`/api/listings/${created.body.id}`)
          .set('Authorization', `Bearer ${user.accessToken}`)
          .send({ title: 'Title From Mutation A', price: 8100, version: originalVersion }),
        request(getApp().getHttpServer())
          .patch(`/api/listings/${created.body.id}`)
          .set('Authorization', `Bearer ${user.accessToken}`)
          .send({ title: 'Title From Mutation B', price: 8200, version: originalVersion }),
      ]);

      const statuses = [reqA.status, reqB.status].sort();
      expect(statuses).toEqual([200, 409]);

      // Check DB final state: version must be exactly 2, and data must match the winner
      const finalDb = await prisma.listing.findUnique({ where: { id: created.body.id } });
      expect(finalDb?.version).toBe(originalVersion + 1);

      const winningResponse = reqA.status === 200 ? reqA : reqB;
      expect(finalDb?.title).toBe(winningResponse.body.title);
      expect(Number(finalDb?.price)).toBe(Number(winningResponse.body.price));
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // P1.2: Reliable Search Synchronization & Outbox Pattern
  // ═══════════════════════════════════════════════════════════════════════════
  describe('P1.2: Search Synchronization & Outbox', () => {
    it('should create an OutboxEvent atomically on successful listing update', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload();
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);

      await request(getApp().getHttpServer())
        .patch(`/api/listings/${created.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ price: 7700, version: 1 })
        .expect(200);

      // Check OutboxEvent in database
      const outboxEvent = await prisma.outboxEvent.findFirst({
        where: {
          entityId: created.body.id,
          entityType: 'LISTING',
          action: 'UPSERT',
        },
      });

      expect(outboxEvent).toBeDefined();
      expect(outboxEvent?.status).toBe('PENDING');
      expect(outboxEvent?.action).toBe('UPSERT');
    });

    it('should not create OutboxEvent if update fails due to OCC conflict', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload();
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);

      const beforeCount = await prisma.outboxEvent.count({
        where: { entityId: created.body.id },
      });

      // Failed update with wrong version
      await request(getApp().getHttpServer())
        .patch(`/api/listings/${created.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ price: 9999, version: 999 })
        .expect(409);

      const afterCount = await prisma.outboxEvent.count({
        where: { entityId: created.body.id },
      });

      expect(afterCount).toBe(beforeCount);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // P0.4: Domain Cross-Field Rules (Rental Validation)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('P0.4: Domain Cross-Field Rules', () => {
    it('should reject RENTAL create without dailyPrice', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload({
        listingType: 'RENTAL',
        dailyPrice: 0,
      });

      await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(400);
    });

    it('should reject SALE -> RENTAL update without dailyPrice', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload({ listingType: 'SALE' });

      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);

      await request(getApp().getHttpServer())
        .patch(`/api/listings/${created.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ listingType: 'RENTAL', version: 1 })
        .expect(400);
    });

    it('should clear rental fields when updating RENTAL -> SALE', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload({
        listingType: 'RENTAL',
        dailyPrice: 50,
        monthlyPrice: 1000,
        withDriver: true,
      });

      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);

      expect(Number(created.body.dailyPrice)).toBe(50);
      expect(created.body.withDriver).toBe(true);

      const updated = await request(getApp().getHttpServer())
        .patch(`/api/listings/${created.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ listingType: 'SALE', version: 1 })
        .expect(200);

      expect(updated.body.listingType).toBe('SALE');
      expect(updated.body.dailyPrice).toBeNull();
      expect(updated.body.monthlyPrice).toBeNull();
      expect(updated.body.withDriver).toBe(false);
    });

    it('should allow editing non-rental fields on a legacy RENTAL listing missing dailyPrice', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload({ listingType: 'RENTAL' });
      
      const legacyListing = await prisma.listing.create({
        data: {
          ...payload,
          listingType: 'RENTAL',
          dailyPrice: null,
          sellerId: user.user.id,
          slug: `legacy-rental-${Date.now()}`,
          make: 'Toyota',
          model: 'Camry'
        },
      });

      await request(getApp().getHttpServer())
        .patch(`/api/listings/${legacyListing.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ title: 'Updated Title', version: legacyListing.version })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated Title');
          expect(res.body.dailyPrice).toBeNull();
        });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // P1.4: Strict Technical Validation
  // ═══════════════════════════════════════════════════════════════════════════
  describe('P1.4: Strict Technical Validation', () => {
    it('should reject invalid latitude (> 90 or < -90)', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload({ latitude: 95.5 });

      await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(400);

      const payloadNeg = await getValidListingPayload({ latitude: -95.5 });
      await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payloadNeg)
        .expect(400);
    });

    it('should reject invalid longitude (> 180 or < -180)', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload({ longitude: 185.0 });

      await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(400);
    });

    it('should reject negative price', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload({ price: -100 });

      await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(400);
    });

    it('should reject negative mileage', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload({ mileage: -500 });

      await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(400);
    });

    it('should reject negative dailyPrice in PATCH', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload();
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);

      await request(getApp().getHttpServer())
        .patch(`/api/listings/${created.body.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ dailyPrice: -25, version: 1 })
        .expect(400);
    });

    it('should reject out-of-boundary year (< 1900 or > 2030)', async () => {
      const user = await registerUser();
      const payloadLow = await getValidListingPayload({ year: 1850 });
      await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payloadLow)
        .expect(400);

      const payloadHigh = await getValidListingPayload({ year: 2050 });
      await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payloadHigh)
        .expect(400);
    });

    it('should reject contradictory canonical identities (Model not belonging to Brand)', async () => {
      const user = await registerUser();
      const { brandId } = await getTestBrandAndModel();

      // Create a different brand with unique name
      const uid = Date.now();
      const brandB = await prisma.brand.create({
        data: {
          name: `BMW_${uid}`,
          slug: `bmw-${uid}_${Math.random().toString(36).slice(2, 6)}`,
          models: {
            create: [{ name: `M3_${uid}`, slug: `m3-${uid}_${Math.random().toString(36).slice(2, 6)}` }],
          },
        },
        include: { models: true },
      });

      // Send Toyota brandId with BMW modelId
      const mismatchedPayload = await getValidListingPayload({
        brandId,
        carModelId: brandB.models[0].id,
      });

      await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(mismatchedPayload)
        .expect(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // P1.5: CORS Allowlist Enforcement
  // ═══════════════════════════════════════════════════════════════════════════
  describe('P1.5: CORS Security', () => {
    it('should allow legitimate origin on OPTIONS preflight', async () => {
      const res = await request(getApp().getHttpServer())
        .options('/api/listings')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should reject or not reflect untrusted origins', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/listings')
        .set('Origin', 'http://malicious-attacker-domain.xyz');

      // Untrusted origins must NOT be reflected in access-control-allow-origin
      expect(res.headers['access-control-allow-origin']).not.toBe('http://malicious-attacker-domain.xyz');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // P0.1: Lifecycle Status Transitions
  // ═══════════════════════════════════════════════════════════════════════════
  describe('P0.1: Lifecycle Status Transitions', () => {
    it('should transition through valid states and reject invalid ones', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload();

      // Create -> ACTIVE
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);
      
      let version = 1;
      const listingId = created.body.id;

      // Stale version conflict on Archive (409)
      await request(getApp().getHttpServer())
        .post(`/api/listings/${listingId}/archive`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ version: version - 1 })
        .expect(409);

      // ACTIVE -> ARCHIVED
      const archiveRes = await request(getApp().getHttpServer())
        .post(`/api/listings/${listingId}/archive`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ version })
        .expect(201);
      expect(archiveRes.body.status).toBe('ARCHIVED');
      version++;

      // ARCHIVED -> ACTIVE (restore)
      const restoreRes = await request(getApp().getHttpServer())
        .post(`/api/listings/${listingId}/restore`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ version })
        .expect(201);
      expect(restoreRes.body.status).toBe('ACTIVE');
      version++;

      // ACTIVE -> SOLD
      const markSoldRes = await request(getApp().getHttpServer())
        .post(`/api/listings/${listingId}/mark-sold`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ version })
        .expect(201);
      expect(markSoldRes.body.status).toBe('SOLD');
      version++;

      // SOLD -> ACTIVE (invalid transition, 403 Forbidden)
      await request(getApp().getHttpServer())
        .post(`/api/listings/${listingId}/submit`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ version })
        .expect(403);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // P0.6: Data Privacy (Phone/Password Stripping)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('P0.6: Data Privacy', () => {
    it('should not expose phone or password in GET /api/listings', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload();
      
      await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .get('/api/listings')
        .expect(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      const listing = res.body.items[0];
      expect(listing).toBeDefined();
      expect(listing.seller.phone).toBeUndefined();
      expect(listing.seller.password).toBeUndefined();
    });

    it('should not expose phone or password in GET /api/listings/:id', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload();
      
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .get(`/api/listings/${created.body.id}`)
        .expect(200);
      
      expect(res.body.seller.phone).toBeUndefined();
      expect(res.body.seller.password).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // P0.7: Image Upload Validation & Access Control
  // ═══════════════════════════════════════════════════════════════════════════
  describe('P0.7: Image Upload Validation', () => {
    it('should allow owner to add/delete images and enforce max 20 limit', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload();
      
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);
      
      const listingId = created.body.id;

      // Add 20 images
      for (let i = 0; i < 20; i++) {
        await request(getApp().getHttpServer())
          .post(`/api/uploads/listings/${listingId}/images/url`)
          .set('Authorization', `Bearer ${user.accessToken}`)
          .send({ url: `https://res.cloudinary.com/test/image${i}.jpg` })
          .expect(201);
      }

      // 21st image should be rejected
      await request(getApp().getHttpServer())
        .post(`/api/uploads/listings/${listingId}/images/url`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ url: 'https://res.cloudinary.com/test/image21.jpg' })
        .expect(400);

      // Verify another user cannot add/delete images to this listing
      const user2 = await registerUser();
      
      await request(getApp().getHttpServer())
        .post(`/api/uploads/listings/${listingId}/images/url`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ url: 'https://res.cloudinary.com/test/image_unauth.jpg' })
        .expect(403);

      // Fetch images to get an ID to delete
      const listingRes = await request(getApp().getHttpServer())
        .get(`/api/listings/${listingId}`)
        .expect(200);
      
      const firstImageId = listingRes.body.images[0].id;

      // Unauth user tries to delete
      await request(getApp().getHttpServer())
        .delete(`/api/uploads/listings/${listingId}/images/${firstImageId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);

      // Owner deletes it successfully
      await request(getApp().getHttpServer())
        .delete(`/api/uploads/listings/${listingId}/images/${firstImageId}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // P1.3: Search Sync / Outbox Processing
  // ═══════════════════════════════════════════════════════════════════════════
  describe('P1.3: Search Synchronization & Outbox Processing', () => {
    it('should process pending OutboxEvents and mark them COMPLETED', async () => {
      // Clear out accumulated events from other tests
      const prisma = getPrisma();
      await prisma.outboxEvent.deleteMany({});

      const user = await registerUser();
      const payload = await getValidListingPayload();
      
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send(payload)
        .expect(201);
      
      const listingId = created.body.id;

      // Verify event exists and is PENDING
      const pendingEvent = await prisma.outboxEvent.findFirst({
        where: { entityId: listingId, status: 'PENDING' }
      });
      expect(pendingEvent).toBeDefined();

      // Trigger the outbox relay (simulating the cron job)
      const outboxRelay = getApp().get(require('../src/search/outbox-relay.service').OutboxRelayService);
      (outboxRelay as any).searchSyncQueue = { addBulk: jest.fn().mockResolvedValue(true) };
      (outboxRelay as any).isProcessing = false; // Bypass background cron job state
      
      await outboxRelay.processOutboxEvents();

      // Verify event is now COMPLETED
      const completedEvent = await prisma.outboxEvent.findFirst({
        where: { id: pendingEvent.id }
      });
      expect(completedEvent.status).toBe('COMPLETED');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // P1.4: Rate Limiting
  // ═══════════════════════════════════════════════════════════════════════════
  describe('P1.4: Rate Limiting', () => {
    it('should reject with 429 Too Many Requests when exceeding limits', async () => {
      const user = await registerUser();
      const payload = await getValidListingPayload();
      
      // local limit is 10 per 60000ms. So we send 11 valid requests with the x-rate-limit-test header.
      for (let i = 0; i < 10; i++) {
        await request(getApp().getHttpServer())
          .post('/api/listings')
          .set('Authorization', `Bearer ${user.accessToken}`)
          .set('x-rate-limit-test', 'true')
          .send({ ...payload, price: 1000 + i })
          .expect(201);
      }
      
      await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .set('x-rate-limit-test', 'true')
        .send(payload)
        .expect(429);
    });
  });
});
