import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validTransport = {
  title: 'Furniture Moving Service Muscat',
  description: 'Professional furniture moving with careful packaging and insurance',
  transportType: 'FURNITURE',
  providerName: 'QuickMove Oman',
  providerType: 'COMPANY',
  basePrice: 50,
  pricingType: 'FIXED',
  hasInsurance: true,
  hasTracking: false,
  governorateId: 1,
  wilayaId: 1,
  contactPhone: '+96899223344',
};

describe('Transport API (e2e)', () => {
  describe('POST /api/transport', () => {
    it('should create a transport service', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/transport')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTransport)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.transportType).toBe('FURNITURE');
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/transport')
        .send(validTransport)
        .expect(401);
    });

    it('should reject invalid transportType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/transport')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validTransport, transportType: 'FLYING' })
        .expect(400);
    });
  });

  describe('GET /api/transport', () => {
    it('should list transport services', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/transport')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });

    it('should filter by transportType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/transport')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTransport);

      const res = await request(getApp().getHttpServer())
        .get('/api/transport?transportType=FURNITURE')
        .expect(200);

      res.body.items.forEach((t: any) => expect(t.transportType).toBe('FURNITURE'));
    });

    it('should support search', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/transport?search=QuickMove')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/transport/:id', () => {
    it('should return transport by id', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/transport')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTransport);

      const res = await request(getApp().getHttpServer())
        .get(`/api/transport/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('should 404 for non-existent transport', async () => {
      await request(getApp().getHttpServer())
        .get('/api/transport/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should include user info', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/transport')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTransport);

      const res = await request(getApp().getHttpServer())
        .get(`/api/transport/${created.body.id}`)
        .expect(200);

      expect(res.body.user).toBeDefined();
    });
  });

  describe('DELETE /api/transport/:id', () => {
    it('should delete own transport', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/transport')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validTransport);

      await request(getApp().getHttpServer())
        .delete(`/api/transport/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject delete by other user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/transport')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validTransport);

      await request(getApp().getHttpServer())
        .delete(`/api/transport/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .delete('/api/transport/some-id')
        .expect(401);
    });
  });
});
