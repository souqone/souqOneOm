import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validRequest = {
  title: 'Need excavator for construction site',
  description: 'Looking for a CAT or Komatsu excavator for a 3-month construction project in Seeb area',
  equipmentType: 'EXCAVATOR',
  quantity: 2,
  budgetMin: 500,
  budgetMax: 3000,
  rentalDuration: '3 months',
  governorateId: 1,
  wilayaId: 1,
  contactPhone: '+96899334455',
};

const validBid = {
  price: 2500,
  availability: 'Available immediately',
  notes: 'CAT 320 in excellent condition',
  withOperator: true,
};

describe('Equipment Requests API (e2e)', () => {
  // ─── Create Request ───
  describe('POST /api/equipment-requests', () => {
    it('should create an equipment request', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/equipment-requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validRequest)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.equipmentType).toBe('EXCAVATOR');
      expect(res.body.requestStatus).toBe('OPEN');
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/equipment-requests')
        .send(validRequest)
        .expect(401);
    });

    it('should reject invalid equipmentType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/equipment-requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validRequest, equipmentType: 'INVALID' })
        .expect(400);
    });

    it('should reject missing title', async () => {
      const { accessToken } = await registerUser();
      const { title, ...noTitle } = validRequest;
      await request(getApp().getHttpServer())
        .post('/api/equipment-requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(noTitle)
        .expect(400);
    });
  });

  // ─── List Requests ───
  describe('GET /api/equipment-requests', () => {
    it('should return paginated requests', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/equipment-requests')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });

    it('should filter by equipmentType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/equipment-requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validRequest);

      const res = await request(getApp().getHttpServer())
        .get('/api/equipment-requests?equipmentType=EXCAVATOR')
        .expect(200);

      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      res.body.items.forEach((r: any) => expect(r.equipmentType).toBe('EXCAVATOR'));
    });
  });

  // ─── Get One Request ───
  describe('GET /api/equipment-requests/:id', () => {
    it('should return request by id', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/equipment-requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validRequest);

      const res = await request(getApp().getHttpServer())
        .get(`/api/equipment-requests/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('should 404 for non-existent request', async () => {
      await request(getApp().getHttpServer())
        .get('/api/equipment-requests/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  // ─── Update Request ───
  describe('PATCH /api/equipment-requests/:id', () => {
    it('should update own request', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/equipment-requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validRequest);

      const res = await request(getApp().getHttpServer())
        .patch(`/api/equipment-requests/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ quantity: 5 })
        .expect(200);

      expect(res.body.quantity).toBe(5);
    });

    it('should reject update by different user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();

      const created = await request(getApp().getHttpServer())
        .post('/api/equipment-requests')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validRequest);

      await request(getApp().getHttpServer())
        .patch(`/api/equipment-requests/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ quantity: 1 })
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .patch('/api/equipment-requests/some-id')
        .send({ quantity: 1 })
        .expect(401);
    });
  });

  // ─── Status State Machine ───
  describe('PATCH /api/equipment-requests/:id/status', () => {
    it('should transition OPEN → IN_PROGRESS', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/equipment-requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validRequest);

      const res = await request(getApp().getHttpServer())
        .patch(`/api/equipment-requests/${created.body.id}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ requestStatus: 'IN_PROGRESS' })
        .expect(200);

      expect(res.body.requestStatus).toBe('IN_PROGRESS');
    });

    it('should transition OPEN → CANCELLED', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/equipment-requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validRequest);

      const res = await request(getApp().getHttpServer())
        .patch(`/api/equipment-requests/${created.body.id}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ requestStatus: 'CANCELLED' })
        .expect(200);

      expect(res.body.requestStatus).toBe('CANCELLED');
    });

    it('should transition IN_PROGRESS → CLOSED', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/equipment-requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validRequest);

      // First move to IN_PROGRESS
      await request(getApp().getHttpServer())
        .patch(`/api/equipment-requests/${created.body.id}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ requestStatus: 'IN_PROGRESS' })
        .expect(200);

      // Then close it
      const res = await request(getApp().getHttpServer())
        .patch(`/api/equipment-requests/${created.body.id}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ requestStatus: 'CLOSED' })
        .expect(200);

      expect(res.body.requestStatus).toBe('CLOSED');
    });

    it('should reject invalid transition OPEN → CLOSED', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/equipment-requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validRequest);

      await request(getApp().getHttpServer())
        .patch(`/api/equipment-requests/${created.body.id}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ requestStatus: 'CLOSED' })
        .expect(400);
    });

    it('should reject status change by non-owner', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();

      const created = await request(getApp().getHttpServer())
        .post('/api/equipment-requests')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validRequest);

      await request(getApp().getHttpServer())
        .patch(`/api/equipment-requests/${created.body.id}/status`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ requestStatus: 'IN_PROGRESS' })
        .expect(403);
    });
  });

  // ─── Delete Request ───
  describe('DELETE /api/equipment-requests/:id', () => {
    it('should delete own request', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/equipment-requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validRequest);

      await request(getApp().getHttpServer())
        .delete(`/api/equipment-requests/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject delete by different user', async () => {
      const user1 = await registerUser();
      const user2 = await registerUser();

      const created = await request(getApp().getHttpServer())
        .post('/api/equipment-requests')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validRequest);

      await request(getApp().getHttpServer())
        .delete(`/api/equipment-requests/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .delete('/api/equipment-requests/some-id')
        .expect(401);
    });
  });

  // ─── Bids ───
  describe('Bids on Equipment Requests', () => {
    describe('POST /api/equipment-requests/:id/bids', () => {
      it('should create a bid on a request', async () => {
        const owner = await registerUser();
        const bidder = await registerUser();

        const req = await request(getApp().getHttpServer())
          .post('/api/equipment-requests')
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send(validRequest);

        const res = await request(getApp().getHttpServer())
          .post(`/api/equipment-requests/${req.body.id}/bids`)
          .set('Authorization', `Bearer ${bidder.accessToken}`)
          .send(validBid)
          .expect(201);

        expect(res.body.id).toBeDefined();
        expect(res.body.bidStatus).toBe('PENDING');
        expect(Number(res.body.price)).toBe(2500);
      });

      it('should reject bid without auth', async () => {
        const owner = await registerUser();
        const req = await request(getApp().getHttpServer())
          .post('/api/equipment-requests')
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send(validRequest);

        await request(getApp().getHttpServer())
          .post(`/api/equipment-requests/${req.body.id}/bids`)
          .send(validBid)
          .expect(401);
      });

      it('should reject bid on non-existent request', async () => {
        const bidder = await registerUser();
        await request(getApp().getHttpServer())
          .post('/api/equipment-requests/00000000-0000-0000-0000-000000000000/bids')
          .set('Authorization', `Bearer ${bidder.accessToken}`)
          .send(validBid)
          .expect(404);
      });
    });

    describe('PATCH /api/equipment-requests/:id/bids/:bidId/accept', () => {
      it('should accept a bid (owner only)', async () => {
        const owner = await registerUser();
        const bidder = await registerUser();

        const req = await request(getApp().getHttpServer())
          .post('/api/equipment-requests')
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send(validRequest);

        const bid = await request(getApp().getHttpServer())
          .post(`/api/equipment-requests/${req.body.id}/bids`)
          .set('Authorization', `Bearer ${bidder.accessToken}`)
          .send(validBid);

        const res = await request(getApp().getHttpServer())
          .patch(`/api/equipment-requests/${req.body.id}/bids/${bid.body.id}/accept`)
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .expect(200);

        expect(res.body.bidStatus).toBe('ACCEPTED');
      });

      it('should reject accept by non-owner', async () => {
        const owner = await registerUser();
        const bidder = await registerUser();
        const stranger = await registerUser();

        const req = await request(getApp().getHttpServer())
          .post('/api/equipment-requests')
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send(validRequest);

        const bid = await request(getApp().getHttpServer())
          .post(`/api/equipment-requests/${req.body.id}/bids`)
          .set('Authorization', `Bearer ${bidder.accessToken}`)
          .send(validBid);

        await request(getApp().getHttpServer())
          .patch(`/api/equipment-requests/${req.body.id}/bids/${bid.body.id}/accept`)
          .set('Authorization', `Bearer ${stranger.accessToken}`)
          .expect(403);
      });
    });

    describe('PATCH /api/equipment-requests/:id/bids/:bidId/reject', () => {
      it('should reject a bid (owner only)', async () => {
        const owner = await registerUser();
        const bidder = await registerUser();

        const req = await request(getApp().getHttpServer())
          .post('/api/equipment-requests')
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send(validRequest);

        const bid = await request(getApp().getHttpServer())
          .post(`/api/equipment-requests/${req.body.id}/bids`)
          .set('Authorization', `Bearer ${bidder.accessToken}`)
          .send(validBid);

        const res = await request(getApp().getHttpServer())
          .patch(`/api/equipment-requests/${req.body.id}/bids/${bid.body.id}/reject`)
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .expect(200);

        expect(res.body.bidStatus).toBe('REJECTED');
      });

      it('should reject reject-bid by non-owner', async () => {
        const owner = await registerUser();
        const bidder = await registerUser();
        const stranger = await registerUser();

        const req = await request(getApp().getHttpServer())
          .post('/api/equipment-requests')
          .set('Authorization', `Bearer ${owner.accessToken}`)
          .send(validRequest);

        const bid = await request(getApp().getHttpServer())
          .post(`/api/equipment-requests/${req.body.id}/bids`)
          .set('Authorization', `Bearer ${bidder.accessToken}`)
          .send(validBid);

        await request(getApp().getHttpServer())
          .patch(`/api/equipment-requests/${req.body.id}/bids/${bid.body.id}/reject`)
          .set('Authorization', `Bearer ${stranger.accessToken}`)
          .expect(403);
      });
    });
  });
});
