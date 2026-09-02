import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validService = {
  title: 'Premium Car Wash Service',
  description: 'Full interior and exterior cleaning with ceramic coating option',
  serviceType: 'CLEANING',
  providerType: 'WORKSHOP',
  providerName: 'AutoClean Oman',
  priceFrom: 5,
  priceTo: 25,
  governorateId: 1,
  wilayaId: 1,
  contactPhone: '+96899112233',
  images: ['https://example.com/wash.jpg'],
};

describe('Services API (e2e)', () => {
  describe('POST /api/services', () => {
    it('should create a service', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validService)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.serviceType).toBe('CLEANING');
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/services')
        .send(validService)
        .expect(401);
    });

    it('should reject invalid serviceType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validService, serviceType: 'INVALID_TYPE' })
        .expect(400);
    });
  });

  describe('GET /api/services', () => {
    it('should list services with pagination', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/services')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });

    it('should filter by serviceType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validService);

      const res = await request(getApp().getHttpServer())
        .get('/api/services?serviceType=CLEANING')
        .expect(200);

      res.body.items.forEach((s: any) => expect(s.serviceType).toBe('CLEANING'));
    });

    it('should support search', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/services?search=AutoClean')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/services/:id', () => {
    it('should return service by id', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validService);

      const res = await request(getApp().getHttpServer())
        .get(`/api/services/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('should 404 for non-existent service', async () => {
      await request(getApp().getHttpServer())
        .get('/api/services/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should include user info', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validService);

      const res = await request(getApp().getHttpServer())
        .get(`/api/services/${created.body.id}`)
        .expect(200);

      expect(res.body.user).toBeDefined();
    });
  });

  describe('PATCH /api/services/:id', () => {
    it('should update own service', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validService);

      const res = await request(getApp().getHttpServer())
        .patch(`/api/services/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ providerName: 'Updated Name' })
        .expect(200);

      expect(res.body.providerName).toBe('Updated Name');
    });

    it('should reject update by other user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validService);

      await request(getApp().getHttpServer())
        .patch(`/api/services/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ providerName: 'Hacked' })
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .patch('/api/services/some-id')
        .send({ providerName: 'X' })
        .expect(401);
    });

    it('should reject invalid PATCH payload with 400 (negative priceTo or invalid priceFrom)', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validService);

      await request(getApp().getHttpServer())
        .patch(`/api/services/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ priceTo: -5 })
        .expect(400);

      await request(getApp().getHttpServer())
        .patch(`/api/services/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ priceFrom: 'not-a-number' })
        .expect(400);
    });
  });

  describe('DELETE /api/services/:id', () => {
    it('should delete own service', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validService);

      await request(getApp().getHttpServer())
        .delete(`/api/services/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject delete by other user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validService);

      await request(getApp().getHttpServer())
        .delete(`/api/services/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .delete('/api/services/some-id')
        .expect(401);
    });
  });
});
