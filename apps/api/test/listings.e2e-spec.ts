import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validListing = {
  title: 'Toyota Camry 2022 for sale',
  description: 'Excellent condition, low mileage Toyota Camry',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  price: 8500,
  mileage: 25000,
  fuelType: 'PETROL',
  transmission: 'AUTOMATIC',
  condition: 'USED',
  governorateId: 1,
  wilayaId: 1,
};

describe('Listings API (e2e)', () => {
  // ─── Create ───
  describe('POST /api/listings', () => {
    it('should create a listing with valid data', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validListing)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe(validListing.title);
      expect(res.body.make).toBe('Toyota');
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/listings')
        .send(validListing)
        .expect(401);
    });

    it('should reject missing required fields', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test' })
        .expect(400);
    });
  });

  // ─── List ───
  describe('GET /api/listings', () => {
    it('should return paginated listings', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/listings')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBeDefined();
    });

    it('should filter by make', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validListing);

      const res = await request(getApp().getHttpServer())
        .get('/api/listings?make=Toyota')
        .expect(200);

      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    });

    it('should support search query', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/listings?search=Camry')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
    });
  });

  // ─── Get One ───
  describe('GET /api/listings/:id', () => {
    it('should return a listing by id', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validListing);

      const res = await request(getApp().getHttpServer())
        .get(`/api/listings/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('should 404 for non-existent listing', async () => {
      await request(getApp().getHttpServer())
        .get('/api/listings/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should include seller info', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validListing);

      const res = await request(getApp().getHttpServer())
        .get(`/api/listings/${created.body.id}`)
        .expect(200);

      expect(res.body.seller || res.body.user).toBeDefined();
    });
  });

  // ─── Update ───
  describe('PATCH /api/listings/:id', () => {
    it('should update own listing', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validListing);

      const res = await request(getApp().getHttpServer())
        .patch(`/api/listings/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ price: 9000 })
        .expect(200);

      expect(Number(res.body.price)).toBe(9000);
    });

    it('should reject update by different user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();

      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validListing);

      await request(getApp().getHttpServer())
        .patch(`/api/listings/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ price: 1 })
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .patch('/api/listings/some-id')
        .send({ price: 1 })
        .expect(401);
    });
  });

  // ─── Delete ───
  describe('DELETE /api/listings/:id', () => {
    it('should delete own listing', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validListing);

      await request(getApp().getHttpServer())
        .delete(`/api/listings/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject delete by different user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();

      const created = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validListing);

      await request(getApp().getHttpServer())
        .delete(`/api/listings/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .delete('/api/listings/some-id')
        .expect(401);
    });
  });
});
