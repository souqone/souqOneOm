import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validDriverProfile = {
  licenseTypes: ['HEAVY'],
  governorateId: 1,
  wilayaId: 1,
};

const submitData = {
  licenseImageUrl: 'https://res.cloudinary.com/test/license.jpg',
  idImageUrl: 'https://res.cloudinary.com/test/id.jpg',
  notes: 'رخصة سارية',
};

describe('Jobs Verification API (e2e)', () => {
  it('should submit verification request', async () => {
    const driver = await registerUser();
    await request(getApp().getHttpServer())
      .post('/api/jobs/driver-profile')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(validDriverProfile)
      .expect(201);

    const res = await request(getApp().getHttpServer())
      .post('/api/jobs/verification/submit')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(submitData)
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('PENDING');
  });

  it('should reject duplicate pending verification', async () => {
    const driver = await registerUser();
    await request(getApp().getHttpServer())
      .post('/api/jobs/driver-profile')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(validDriverProfile)
      .expect(201);

    await request(getApp().getHttpServer())
      .post('/api/jobs/verification/submit')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(submitData)
      .expect(201);

    await request(getApp().getHttpServer())
      .post('/api/jobs/verification/submit')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(submitData)
      .expect(409);
  });

  it('should get verification status', async () => {
    const driver = await registerUser();
    await request(getApp().getHttpServer())
      .post('/api/jobs/driver-profile')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(validDriverProfile)
      .expect(201);

    await request(getApp().getHttpServer())
      .post('/api/jobs/verification/submit')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(submitData)
      .expect(201);

    const res = await request(getApp().getHttpServer())
      .get('/api/jobs/verification/status')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .expect(200);

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].status).toBe('PENDING');
  });

  it('should reject admin endpoints for non-admin users', async () => {
    const user = await registerUser();

    await request(getApp().getHttpServer())
      .get('/api/jobs/admin/verifications')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(403);
  });

  it('should require auth for verification', async () => {
    await request(getApp().getHttpServer())
      .post('/api/jobs/verification/submit')
      .send(submitData)
      .expect(401);
  });

  it('should reject verification without driver profile', async () => {
    const user = await registerUser();
    await request(getApp().getHttpServer())
      .post('/api/jobs/verification/submit')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(submitData)
      .expect(404);
  });
});
