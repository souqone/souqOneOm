import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validInsurance = {
  title: 'Comprehensive Car Insurance',
  description: 'Full coverage car insurance with roadside assistance and agency repair',
  offerType: 'CAR_COMPREHENSIVE',
  providerName: 'Oman Insurance Co',
  coverageType: 'Full Coverage',
  priceFrom: 150,
  features: ['Roadside Assistance', 'Agency Repair', 'Replacement Car'],
  contactPhone: '+96899445566',
  governorateId: 1,
  wilayaId: 1,
};

describe('Insurance API (e2e)', () => {
  describe('POST /api/insurance', () => {
    it('should create an insurance offer', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/insurance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validInsurance)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.offerType).toBe('CAR_COMPREHENSIVE');
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/insurance')
        .send(validInsurance)
        .expect(401);
    });

    it('should reject invalid offerType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/insurance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validInsurance, offerType: 'INVALID' })
        .expect(400);
    });
  });

  describe('GET /api/insurance', () => {
    it('should list insurance offers', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/insurance')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });

    it('should filter by offerType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/insurance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validInsurance);

      const res = await request(getApp().getHttpServer())
        .get('/api/insurance?offerType=CAR_COMPREHENSIVE')
        .expect(200);

      res.body.items.forEach((i: any) => expect(i.offerType).toBe('CAR_COMPREHENSIVE'));
    });

    it('should support search', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/insurance?search=Comprehensive')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/insurance/:id', () => {
    it('should return offer by id', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/insurance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validInsurance);

      const res = await request(getApp().getHttpServer())
        .get(`/api/insurance/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
      expect(res.body.features).toEqual(expect.arrayContaining(['Roadside Assistance']));
    });

    it('should 404 for non-existent offer', async () => {
      await request(getApp().getHttpServer())
        .get('/api/insurance/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should include user info', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/insurance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validInsurance);

      const res = await request(getApp().getHttpServer())
        .get(`/api/insurance/${created.body.id}`)
        .expect(200);

      expect(res.body.user).toBeDefined();
    });
  });

  describe('DELETE /api/insurance/:id', () => {
    it('should delete own offer', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/insurance')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validInsurance);

      await request(getApp().getHttpServer())
        .delete(`/api/insurance/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject delete by other user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/insurance')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validInsurance);

      await request(getApp().getHttpServer())
        .delete(`/api/insurance/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .delete('/api/insurance/some-id')
        .expect(401);
    });
  });
});
