import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validPart = {
  title: 'Engine Oil Filter Toyota',
  description: 'Original Toyota oil filter, fits Camry 2018-2023 models perfectly',
  partCategory: 'ENGINE',
  condition: 'NEW',
  price: 5,
  isOriginal: true,
  compatibleMakes: ['Toyota'],
  governorateId: 1,
  wilayaId: 1,
  contactPhone: '+96899001122',
};

describe('Parts API (e2e)', () => {
  describe('POST /api/parts', () => {
    it('should create a spare part', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/parts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validPart)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe(validPart.title);
      expect(res.body.partCategory).toBe('ENGINE');
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/parts')
        .send(validPart)
        .expect(401);
    });

    it('should reject invalid partCategory', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/parts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validPart, partCategory: 'INVALID' })
        .expect(400);
    });

    it('should reject missing title', async () => {
      const { accessToken } = await registerUser();
      const { title, ...noTitle } = validPart;
      await request(getApp().getHttpServer())
        .post('/api/parts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(noTitle)
        .expect(400);
    });
  });

  describe('GET /api/parts', () => {
    it('should list parts with pagination', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/parts')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });

    it('should filter by partCategory', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/parts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validPart);

      const res = await request(getApp().getHttpServer())
        .get('/api/parts?partCategory=ENGINE')
        .expect(200);

      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      res.body.items.forEach((p: any) => expect(p.partCategory).toBe('ENGINE'));
    });

    it('should support search', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/parts?search=Toyota')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/parts/:id', () => {
    it('should return part by id', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/parts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validPart);

      const res = await request(getApp().getHttpServer())
        .get(`/api/parts/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('should 404 for non-existent part', async () => {
      await request(getApp().getHttpServer())
        .get('/api/parts/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should include seller info', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/parts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validPart);

      const res = await request(getApp().getHttpServer())
        .get(`/api/parts/${created.body.id}`)
        .expect(200);

      expect(res.body.seller || res.body.user).toBeDefined();
    });
  });

  describe('PATCH /api/parts/:id', () => {
    it('should update own part', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/parts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validPart);

      const res = await request(getApp().getHttpServer())
        .patch(`/api/parts/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ price: 10 })
        .expect(200);

      expect(Number(res.body.price)).toBe(10);
    });

    it('should reject update by other user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();

      const created = await request(getApp().getHttpServer())
        .post('/api/parts')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validPart);

      await request(getApp().getHttpServer())
        .patch(`/api/parts/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ price: 1 })
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .patch('/api/parts/some-id')
        .send({ price: 1 })
        .expect(401);
    });
  });

  describe('DELETE /api/parts/:id', () => {
    it('should delete own part', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/parts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validPart);

      await request(getApp().getHttpServer())
        .delete(`/api/parts/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject delete by other user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();

      const created = await request(getApp().getHttpServer())
        .post('/api/parts')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validPart);

      await request(getApp().getHttpServer())
        .delete(`/api/parts/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .delete('/api/parts/some-id')
        .expect(401);
    });
  });
});
