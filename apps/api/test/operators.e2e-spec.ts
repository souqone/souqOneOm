import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validOperator = {
  title: 'Experienced crane operator available',
  description: 'Certified crane operator with 8 years of experience in construction and port operations',
  operatorType: 'OPERATOR',
  specializations: ['Tower Crane', 'Mobile Crane'],
  experienceYears: 8,
  equipmentTypes: ['CRANE', 'FORKLIFT'],
  certifications: ['OSHA Certified', 'ISO 9001'],
  dailyRate: 45,
  hourlyRate: 8,
  governorateId: 1, // Muscat
  wilayaId: 1,      // Seeb
  contactPhone: '+96899445566',
};

describe('Operators API (e2e)', () => {
  // ─── Create ───
  describe('POST /api/operators', () => {
    it('should create an operator listing', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/operators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validOperator)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.operatorType).toBe('OPERATOR');
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/operators')
        .send(validOperator)
        .expect(401);
    });

    it('should reject invalid operatorType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/operators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validOperator, operatorType: 'INVALID' })
        .expect(400);
    });

    it('should reject missing title', async () => {
      const { accessToken } = await registerUser();
      const { title, ...noTitle } = validOperator;
      await request(getApp().getHttpServer())
        .post('/api/operators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(noTitle)
        .expect(400);
    });

    it('should reject invalid location pair (governorate vs wilaya mismatch)', async () => {
      const { accessToken } = await registerUser();
      // wilayaId: 50 exists but does not belong to governorateId: 1
      await request(getApp().getHttpServer())
        .post('/api/operators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validOperator, governorateId: 1, wilayaId: 50 })
        .expect(400);
    });
  });

  // ─── List ───
  describe('GET /api/operators', () => {
    it('should return paginated operators', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/operators')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });

    it('should filter by operatorType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/operators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validOperator);

      const res = await request(getApp().getHttpServer())
        .get('/api/operators?operatorType=OPERATOR')
        .expect(200);

      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      res.body.items.forEach((o: any) => expect(o.operatorType).toBe('OPERATOR'));
    });

    it('should support search', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/operators?search=crane')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
    });
  });

  // ─── Get One ───
  describe('GET /api/operators/:id', () => {
    it('should return operator by id', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/operators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validOperator);

      const res = await request(getApp().getHttpServer())
        .get(`/api/operators/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('should 404 for non-existent operator', async () => {
      await request(getApp().getHttpServer())
        .get('/api/operators/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should include user info', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/operators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validOperator);

      const res = await request(getApp().getHttpServer())
        .get(`/api/operators/${created.body.id}`)
        .expect(200);

      expect(res.body.user).toBeDefined();
    });
  });

  // ─── Update ───
  describe('PATCH /api/operators/:id', () => {
    it('should update own operator listing', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/operators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validOperator)
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .patch(`/api/operators/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ dailyRate: 55 })
        .expect(200);

      expect(Number(res.body.dailyRate)).toBe(55);
    });

    it('should reject update by different user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();

      const created = await request(getApp().getHttpServer())
        .post('/api/operators')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validOperator);

      await request(getApp().getHttpServer())
        .patch(`/api/operators/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ dailyRate: 1 })
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .patch('/api/operators/some-id')
        .send({ dailyRate: 1 })
        .expect(401);
    });
  });

  // ─── Delete ───
  describe('DELETE /api/operators/:id', () => {
    it('should delete own operator listing', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/operators')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validOperator);

      await request(getApp().getHttpServer())
        .delete(`/api/operators/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject delete by different user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();

      const created = await request(getApp().getHttpServer())
        .post('/api/operators')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validOperator);

      await request(getApp().getHttpServer())
        .delete(`/api/operators/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .delete('/api/operators/some-id')
        .expect(401);
    });
  });
});
