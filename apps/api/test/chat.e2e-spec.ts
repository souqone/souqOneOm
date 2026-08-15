import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validListing = {
  title: 'Chat Test Car Listing',
  description: 'A car listing to create chat conversations about',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  price: 8000,
  condition: 'USED',
  governorateId: 1,
  wilayaId: 1,
};

/** Helper: create a listing as seller, return { listingId, seller, buyer } */
async function createListingAndBuyer() {
  const seller = await registerUser();
  const buyer = await registerUser();

  const listing = await request(getApp().getHttpServer())
    .post('/api/listings')
    .set('Authorization', `Bearer ${seller.accessToken}`)
    .send(validListing)
    .expect(201);

  return { listingId: listing.body.id, seller, buyer };
}

describe('Chat API (e2e)', () => {
  describe('POST /api/chat/conversations', () => {
    it('should create a conversation via listing', async () => {
      const { listingId, buyer } = await createListingAndBuyer();

      const res = await request(getApp().getHttpServer())
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .send({ entityType: 'LISTING', entityId: listingId })
        .expect(201);

      expect(res.body.id).toBeDefined();
    });

    it('should return existing conversation if already exists', async () => {
      const { listingId, buyer } = await createListingAndBuyer();

      const first = await request(getApp().getHttpServer())
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .send({ entityType: 'LISTING', entityId: listingId });

      const second = await request(getApp().getHttpServer())
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .send({ entityType: 'LISTING', entityId: listingId });

      expect(first.body.id).toBe(second.body.id);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/chat/conversations')
        .send({ entityType: 'LISTING', entityId: 'some-id' })
        .expect(401);
    });
  });

  describe('GET /api/chat/conversations', () => {
    it('should list user conversations', async () => {
      const user1 = await registerUser();
      const res = await request(getApp().getHttpServer())
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .get('/api/chat/conversations')
        .expect(401);
    });

    it('should show conversations after creation', async () => {
      const { listingId, buyer } = await createListingAndBuyer();

      await request(getApp().getHttpServer())
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .send({ entityType: 'LISTING', entityId: listingId });

      const res = await request(getApp().getHttpServer())
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/chat/conversations/:id/messages', () => {
    it('should send a message', async () => {
      const { listingId, buyer } = await createListingAndBuyer();

      const conv = await request(getApp().getHttpServer())
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .send({ entityType: 'LISTING', entityId: listingId });

      const res = await request(getApp().getHttpServer())
        .post(`/api/chat/conversations/${conv.body.id}/messages`)
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .send({ content: 'Test message' })
        .expect(201);

      expect(res.body.content).toBe('Test message');
    });

    it('should reject empty message', async () => {
      const { listingId, buyer } = await createListingAndBuyer();

      const conv = await request(getApp().getHttpServer())
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .send({ entityType: 'LISTING', entityId: listingId });

      await request(getApp().getHttpServer())
        .post(`/api/chat/conversations/${conv.body.id}/messages`)
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .send({ content: '' })
        .expect(400);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/chat/conversations/some-id/messages')
        .send({ content: 'Test' })
        .expect(401);
    });
  });

  describe('PATCH /api/chat/conversations/:id/read', () => {
    it('should mark conversation as read', async () => {
      const { listingId, seller, buyer } = await createListingAndBuyer();

      const conv = await request(getApp().getHttpServer())
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .send({ entityType: 'LISTING', entityId: listingId });

      // buyer sends message, seller marks read
      await request(getApp().getHttpServer())
        .post(`/api/chat/conversations/${conv.body.id}/messages`)
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .send({ content: 'Read this' });

      const res = await request(getApp().getHttpServer())
        .patch(`/api/chat/conversations/${conv.body.id}/read`)
        .set('Authorization', `Bearer ${seller.accessToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .patch('/api/chat/conversations/some-id/read')
        .expect(401);
    });

    it('should handle non-participant gracefully', async () => {
      const { listingId, buyer } = await createListingAndBuyer();
      const outsider = await registerUser();

      const conv = await request(getApp().getHttpServer())
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${buyer.accessToken}`)
        .send({ entityType: 'LISTING', entityId: listingId });

      const res = await request(getApp().getHttpServer())
        .patch(`/api/chat/conversations/${conv.body.id}/read`)
        .set('Authorization', `Bearer ${outsider.accessToken}`);

      expect([200, 403]).toContain(res.status);
    });
  });
});
