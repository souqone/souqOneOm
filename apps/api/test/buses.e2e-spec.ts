import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validBus = {
  title: 'Mercedes Sprinter School Bus for sale',
  description: 'Well-maintained school bus, recently serviced with new tires and AC',
  busListingType: 'BUS_SALE',
  busType: 'SCHOOL_BUS',
  make: 'Mercedes',
  model: 'Sprinter',
  year: 2020,
  capacity: 30,
  mileage: 80000,
  fuelType: 'DIESEL',
  transmission: 'AUTOMATIC',
  condition: 'USED',
  price: 12000,
  governorateId: 1,
  wilayaId: 1,
  contactPhone: '+96899112233',
};

describe('Buses API (e2e)', () => {
  // ─── Create ───
  describe('POST /api/buses', () => {
    it('should create a bus listing', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/buses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validBus)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.busListingType).toBe('BUS_SALE');
      expect(res.body.busType).toBe('SCHOOL_BUS');
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/buses')
        .send(validBus)
        .expect(401);
    });

    it('should reject invalid busListingType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/buses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validBus, busListingType: 'INVALID' })
        .expect(400);
    });

    it('should reject invalid busType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/buses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validBus, busType: 'INVALID' })
        .expect(400);
    });

    it('should reject missing required fields', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/buses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Short' })
        .expect(400);
    });
  });

  // ─── List ───
  describe('GET /api/buses', () => {
    it('should return paginated bus listings', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/buses')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });

    it('should filter by busType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/buses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validBus);

      const res = await request(getApp().getHttpServer())
        .get('/api/buses?busType=SCHOOL_BUS')
        .expect(200);

      res.body.items.forEach((b: any) => expect(b.busType).toBe('SCHOOL_BUS'));
    });

    it('should filter by busListingType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/buses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validBus);

      const res = await request(getApp().getHttpServer())
        .get('/api/buses?busListingType=BUS_SALE')
        .expect(200);

      res.body.items.forEach((b: any) => expect(b.busListingType).toBe('BUS_SALE'));
    });

    it('should support search', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/buses?search=Mercedes')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
    });
  });

  // ─── Get One ───
  describe('GET /api/buses/:id', () => {
    it('should return bus by id', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/buses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validBus);

      const res = await request(getApp().getHttpServer())
        .get(`/api/buses/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('should 404 for non-existent bus', async () => {
      await request(getApp().getHttpServer())
        .get('/api/buses/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should include user info', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/buses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validBus);

      const res = await request(getApp().getHttpServer())
        .get(`/api/buses/${created.body.id}`)
        .expect(200);

      expect(res.body.user).toBeDefined();
    });
  });

  // ─── Update ───
  describe('PATCH /api/buses/:id', () => {
    it('should update own bus listing', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/buses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validBus);

      const res = await request(getApp().getHttpServer())
        .patch(`/api/buses/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ price: 15000 })
        .expect(200);

      expect(Number(res.body.price)).toBe(15000);
    });

    it('should reject update by different user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();

      const created = await request(getApp().getHttpServer())
        .post('/api/buses')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validBus);

      await request(getApp().getHttpServer())
        .patch(`/api/buses/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ price: 1 })
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .patch('/api/buses/some-id')
        .send({ price: 1 })
        .expect(401);
    });
  });

  // ─── Delete ───
  describe('DELETE /api/buses/:id', () => {
    it('should delete own bus listing', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/buses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validBus);

      await request(getApp().getHttpServer())
        .delete(`/api/buses/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject delete by different user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();

      const created = await request(getApp().getHttpServer())
        .post('/api/buses')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validBus);

      await request(getApp().getHttpServer())
        .delete(`/api/buses/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .delete('/api/buses/some-id')
        .expect(401);
    });
  });
});
