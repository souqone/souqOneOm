import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validJob = {
  title: 'سائق نقل ثقيل للدعوات',
  description: 'مطلوب سائق نقل ثقيل بخبرة لا تقل عن 3 سنوات',
  jobType: 'HIRING',
  employmentType: 'FULL_TIME',
  governorateId: 1,
  wilayaId: 1,
  licenseTypes: ['HEAVY'],
};

const validDriverProfile = {
  licenseTypes: ['HEAVY'],
  governorateId: 1,
  wilayaId: 1,
  bio: 'سائق محترف بخبرة طويلة في النقل',
};

describe('Jobs Invites API (e2e)', () => {
  it('should invite a driver to a job', async () => {
    const employer = await registerUser();
    const driver = await registerUser();

    // Employer creates a job
    const jobRes = await request(getApp().getHttpServer())
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send(validJob)
      .expect(201);

    // Driver creates a profile
    await request(getApp().getHttpServer())
      .post('/api/jobs/driver-profile')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(validDriverProfile)
      .expect(201);

    // Employer invites driver
    const res = await request(getApp().getHttpServer())
      .post(`/api/jobs/${jobRes.body.id}/invite/${driver.user.id}`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send({ message: 'انضم لفريقنا!' })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('PENDING');
  });

  it('should reject duplicate invite', async () => {
    const employer = await registerUser();
    const driver = await registerUser();

    const jobRes = await request(getApp().getHttpServer())
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send(validJob)
      .expect(201);

    await request(getApp().getHttpServer())
      .post('/api/jobs/driver-profile')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(validDriverProfile)
      .expect(201);

    await request(getApp().getHttpServer())
      .post(`/api/jobs/${jobRes.body.id}/invite/${driver.user.id}`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .expect(201);

    await request(getApp().getHttpServer())
      .post(`/api/jobs/${jobRes.body.id}/invite/${driver.user.id}`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .expect(409);
  });

  it('should reject invite by non-owner (403)', async () => {
    const employer = await registerUser();
    const otherUser = await registerUser();
    const driver = await registerUser();

    const jobRes = await request(getApp().getHttpServer())
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send(validJob)
      .expect(201);

    await request(getApp().getHttpServer())
      .post('/api/jobs/driver-profile')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(validDriverProfile)
      .expect(201);

    await request(getApp().getHttpServer())
      .post(`/api/jobs/${jobRes.body.id}/invite/${driver.user.id}`)
      .set('Authorization', `Bearer ${otherUser.accessToken}`)
      .expect(403);
  });

  it('should get my invites as driver', async () => {
    const employer = await registerUser();
    const driver = await registerUser();

    const jobRes = await request(getApp().getHttpServer())
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send(validJob)
      .expect(201);

    await request(getApp().getHttpServer())
      .post('/api/jobs/driver-profile')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(validDriverProfile)
      .expect(201);

    await request(getApp().getHttpServer())
      .post(`/api/jobs/${jobRes.body.id}/invite/${driver.user.id}`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .expect(201);

    const res = await request(getApp().getHttpServer())
      .get('/api/jobs/invites/my')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .expect(200);

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].job).toBeDefined();
  });

  it('should accept invite', async () => {
    const employer = await registerUser();
    const driver = await registerUser();

    const jobRes = await request(getApp().getHttpServer())
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send(validJob)
      .expect(201);

    await request(getApp().getHttpServer())
      .post('/api/jobs/driver-profile')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(validDriverProfile)
      .expect(201);

    const inviteRes = await request(getApp().getHttpServer())
      .post(`/api/jobs/${jobRes.body.id}/invite/${driver.user.id}`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .expect(201);

    const res = await request(getApp().getHttpServer())
      .patch(`/api/jobs/invites/${inviteRes.body.id}`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ status: 'ACCEPTED' })
      .expect(200);

    expect(res.body.status).toBe('ACCEPTED');
  });

  it('should decline invite', async () => {
    const employer = await registerUser();
    const driver = await registerUser();

    const jobRes = await request(getApp().getHttpServer())
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send(validJob)
      .expect(201);

    await request(getApp().getHttpServer())
      .post('/api/jobs/driver-profile')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(validDriverProfile)
      .expect(201);

    const inviteRes = await request(getApp().getHttpServer())
      .post(`/api/jobs/${jobRes.body.id}/invite/${driver.user.id}`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .expect(201);

    const res = await request(getApp().getHttpServer())
      .patch(`/api/jobs/invites/${inviteRes.body.id}`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ status: 'DECLINED' })
      .expect(200);

    expect(res.body.status).toBe('DECLINED');
  });

  it('should require auth', async () => {
    await request(getApp().getHttpServer())
      .get('/api/jobs/invites/my')
      .expect(401);
  });
});
