import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validEquipment = {
  title: 'CAT 320 Excavator for rent',
  description: 'Caterpillar 320 excavator in excellent condition, available for daily or monthly rental',
  equipmentType: 'EXCAVATOR',
  listingType: 'EQUIPMENT_RENT',
  make: 'CAT',
  model: '320',
  year: 2021,
  condition: 'USED',
  dailyPrice: 120,
  monthlyPrice: 2800,
  governorateId: 1, // Muscat
  wilayaId: 1,      // Seeb
  contactPhone: '+96899223344',
};

describe('Equipment Listings API (e2e)', () => {
  // ─── Create ───
  describe('POST /api/equipment', () => {
    it('should create an equipment listing', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validEquipment)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.equipmentType).toBe('EXCAVATOR');
      expect(res.body.listingType).toBe('EQUIPMENT_RENT');
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/equipment')
        .send(validEquipment)
        .expect(401);
    });

    it('should reject invalid equipmentType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validEquipment, equipmentType: 'INVALID' })
        .expect(400);
    });

    it('should reject invalid listingType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validEquipment, listingType: 'INVALID' })
        .expect(400);
    });

    it('should reject missing title', async () => {
      const { accessToken } = await registerUser();
      const { title, ...noTitle } = validEquipment;
      await request(getApp().getHttpServer())
        .post('/api/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(noTitle)
        .expect(400);
    });

    it('should reject invalid location pair (governorate vs wilaya mismatch)', async () => {
      const { accessToken } = await registerUser();
      // wilayaId: 50 exists but does not belong to governorateId: 1
      await request(getApp().getHttpServer())
        .post('/api/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validEquipment, governorateId: 1, wilayaId: 50 })
        .expect(400);
    });
  });

  // ─── List ───
  describe('GET /api/equipment', () => {
    it('should return paginated equipment listings', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/equipment')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });

    it('should filter by equipmentType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validEquipment);

      const res = await request(getApp().getHttpServer())
        .get('/api/equipment?equipmentType=EXCAVATOR')
        .expect(200);

      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      res.body.items.forEach((e: any) => expect(e.equipmentType).toBe('EXCAVATOR'));
    });

    it('should filter by listingType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validEquipment);

      const res = await request(getApp().getHttpServer())
        .get('/api/equipment?listingType=EQUIPMENT_RENT')
        .expect(200);

      res.body.items.forEach((e: any) => expect(e.listingType).toBe('EQUIPMENT_RENT'));
    });

    it('should support search', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/equipment?search=CAT')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
    });
  });

  // ─── Get One ───
  describe('GET /api/equipment/:id', () => {
    it('should return equipment by id', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validEquipment);

      const res = await request(getApp().getHttpServer())
        .get(`/api/equipment/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('should 404 for non-existent equipment', async () => {
      await request(getApp().getHttpServer())
        .get('/api/equipment/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should include user info', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validEquipment);

      const res = await request(getApp().getHttpServer())
        .get(`/api/equipment/${created.body.id}`)
        .expect(200);

      expect(res.body.user).toBeDefined();
    });
  });

  // ─── Update ───
  describe('PATCH /api/equipment/:id', () => {
    it('should update own equipment', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validEquipment);

      const res = await request(getApp().getHttpServer())
        .patch(`/api/equipment/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ dailyPrice: 150 })
        .expect(200);

      expect(Number(res.body.dailyPrice)).toBe(150);
    });

    it('should reject update by different user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();

      const created = await request(getApp().getHttpServer())
        .post('/api/equipment')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validEquipment);

      await request(getApp().getHttpServer())
        .patch(`/api/equipment/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ dailyPrice: 1 })
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .patch('/api/equipment/some-id')
        .send({ dailyPrice: 1 })
        .expect(401);
    });
  });

  // ─── Delete ───
  describe('DELETE /api/equipment/:id', () => {
    it('should delete own equipment', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validEquipment);

      await request(getApp().getHttpServer())
        .delete(`/api/equipment/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject delete by different user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();

      const created = await request(getApp().getHttpServer())
        .post('/api/equipment')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validEquipment);

      await request(getApp().getHttpServer())
        .delete(`/api/equipment/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .delete('/api/equipment/some-id')
        .expect(401);
    });
  });
});
