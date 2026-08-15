import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validRequest = {
  serviceType: 'FURNITURE',
  cargoDescription: 'Need furniture moved from Seeb to Bawshar with care',
  fromGovernorateId: 1,
  fromWilayaId: 1,
  fromAddress: 'Seeb, Muscat Street 12',
  toGovernorateId: 1,
  toWilayaId: 1,
  toAddress: 'Bawshar, Muscat Street 34',
};

const validCarrier = {
  companyName: 'QuickMove Oman',
  bio: 'Professional furniture moving with careful packaging and insurance',
  vehicleTypes: ['PICKUP'],
  serviceTypes: ['FURNITURE'],
  governorateId: 1,
  wilayaId: 1,
  contactPhone: '+96899223344',
};

describe('Transport API (e2e)', () => {
  describe('POST /api/transport/requests', () => {
    it('should create a transport request', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/transport/requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validRequest)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.serviceType).toBe('FURNITURE');
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/transport/requests')
        .send(validRequest)
        .expect(401);
    });

    it('should reject invalid serviceType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/transport/requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validRequest, serviceType: 'FLYING' })
        .expect(400);
    });
  });

  describe('GET /api/transport/requests', () => {
    it('should list transport requests', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/transport/requests')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });

    it('should filter by serviceType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/transport/requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validRequest);

      const res = await request(getApp().getHttpServer())
        .get('/api/transport/requests?serviceType=FURNITURE')
        .expect(200);

      res.body.items.forEach((t: any) => expect(t.serviceType).toBe('FURNITURE'));
    });
  });

  describe('GET /api/transport/requests/:id', () => {
    it('should return transport request by id', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/transport/requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validRequest);

      const res = await request(getApp().getHttpServer())
        .get(`/api/transport/requests/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('should 404 for non-existent request', async () => {
      await request(getApp().getHttpServer())
        .get('/api/transport/requests/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('Carrier Profiles & Carriers Directory', () => {
    it('should create a carrier profile', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/transport/carrier-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validCarrier)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.companyName).toBe('QuickMove Oman');
    });

    it('should list carriers', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/transport/carriers')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
    });
  });
});
