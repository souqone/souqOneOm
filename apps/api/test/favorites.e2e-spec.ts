import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validListing = {
  title: 'Fav Test Car Listing',
  description: 'A car listing to test favorites functionality',
  make: 'Honda',
  model: 'Civic',
  year: 2021,
  price: 7000,
  governorateId: 1,
  wilayaId: 1,
};

describe('Favorites API (e2e)', () => {
  describe('POST /api/favorites/:listingId', () => {
    it('should toggle favorite on', async () => {
      const { accessToken } = await registerUser();

      // Create a listing first
      const listing = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validListing);

      const res = await request(getApp().getHttpServer())
        .post(`/api/favorites/${listing.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(res.body.favorited).toBe(true);
    });

    it('should toggle favorite off', async () => {
      const { accessToken } = await registerUser();
      const listing = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validListing);

      // Toggle on
      await request(getApp().getHttpServer())
        .post(`/api/favorites/${listing.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Toggle off
      const res = await request(getApp().getHttpServer())
        .post(`/api/favorites/${listing.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(res.body.favorited).toBe(false);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/favorites/some-id')
        .expect(401);
    });
  });

  describe('GET /api/favorites', () => {
    it('should list user favorites', async () => {
      const { accessToken } = await registerUser();

      const res = await request(getApp().getHttpServer())
        .get('/api/favorites')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
    });

    it('should include favorited listings', async () => {
      const { accessToken } = await registerUser();
      const listing = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validListing);

      await request(getApp().getHttpServer())
        .post(`/api/favorites/${listing.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const res = await request(getApp().getHttpServer())
        .get('/api/favorites')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .get('/api/favorites')
        .expect(401);
    });
  });

  describe('GET /api/favorites/check/:listingId', () => {
    it('should return true for favorited listing', async () => {
      const { accessToken } = await registerUser();
      const listing = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validListing);

      await request(getApp().getHttpServer())
        .post(`/api/favorites/${listing.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const res = await request(getApp().getHttpServer())
        .get(`/api/favorites/check/${listing.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.favorited).toBe(true);
    });

    it('should return false for non-favorited listing', async () => {
      const { accessToken } = await registerUser();
      const listing = await request(getApp().getHttpServer())
        .post('/api/listings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validListing);

      const res = await request(getApp().getHttpServer())
        .get(`/api/favorites/check/${listing.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.favorited).toBe(false);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .get('/api/favorites/check/some-id')
        .expect(401);
    });
  });
});
