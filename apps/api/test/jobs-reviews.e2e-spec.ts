import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validJob = {
  title: 'وظيفة اختبار تقييمات',
  description: 'وظيفة للاختبار في مسقط عمان',
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
};

async function registerEmployer() {
  const user = await registerUser();
  await request(getApp().getHttpServer())
    .post('/api/jobs/employer-profile')
    .set('Authorization', `Bearer ${user.accessToken}`)
    .send({
      companyName: 'Test Employer Company',
      companySize: 'MEDIUM',
      governorateId: 1,
      wilayaId: 1,
    });
  return user;
}

describe('Jobs Reviews API (e2e)', () => {
  it('should reject review without ACCEPTED application', async () => {
    const employer = await registerEmployer();
    const driver = await registerUser();

    // Create driver profile
    const profileRes = await request(getApp().getHttpServer())
      .post('/api/jobs/driver-profile')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(validDriverProfile)
      .expect(201);

    // Try to review without any application
    await request(getApp().getHttpServer())
      .post('/api/reviews')
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send({
        rating: 5,
        comment: 'ممتاز',
        entityType: 'DRIVER_PROFILE',
        entityId: profileRes.body.id,
        revieweeId: driver.user.id,
      })
      .expect(400);
  });

  it('should allow review after ACCEPTED application', async () => {
    const employer = await registerEmployer();
    const driver = await registerUser();

    // Create job
    const jobRes = await request(getApp().getHttpServer())
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send(validJob)
      .expect(201);

    // Create driver profile
    const profileRes = await request(getApp().getHttpServer())
      .post('/api/jobs/driver-profile')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(validDriverProfile)
      .expect(201);

    // Driver applies
    const appRes = await request(getApp().getHttpServer())
      .post(`/api/jobs/${jobRes.body.id}/apply`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ message: 'أريد العمل' })
      .expect(201);

    // Employer accepts
    await request(getApp().getHttpServer())
      .patch(`/api/jobs/applications/${appRes.body.id}`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send({ status: 'ACCEPTED' })
      .expect(200);

    // Now employer can review the driver
    const reviewRes = await request(getApp().getHttpServer())
      .post('/api/reviews')
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send({
        rating: 5,
        comment: 'سائق ممتاز',
        entityType: 'DRIVER_PROFILE',
        entityId: profileRes.body.id,
        revieweeId: driver.user.id,
      })
      .expect(201);

    expect(reviewRes.body.rating).toBe(5);
    expect(reviewRes.body.comment).toBe('سائق ممتاز');
  });

  it('should get driver reviews', async () => {
    const employer = await registerEmployer();
    const driver = await registerUser();

    // Setup: job + profile + apply + accept + review
    const jobRes = await request(getApp().getHttpServer())
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send(validJob)
      .expect(201);

    const profileRes = await request(getApp().getHttpServer())
      .post('/api/jobs/driver-profile')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(validDriverProfile)
      .expect(201);

    const appRes = await request(getApp().getHttpServer())
      .post(`/api/jobs/${jobRes.body.id}/apply`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ message: 'test' })
      .expect(201);

    await request(getApp().getHttpServer())
      .patch(`/api/jobs/applications/${appRes.body.id}`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send({ status: 'ACCEPTED' })
      .expect(200);

    await request(getApp().getHttpServer())
      .post('/api/reviews')
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send({
        rating: 4,
        comment: 'جيد جداً',
        entityType: 'DRIVER_PROFILE',
        entityId: profileRes.body.id,
        revieweeId: driver.user.id,
      })
      .expect(201);

    // Fetch reviews
    const res = await request(getApp().getHttpServer())
      .get(`/api/jobs/drivers/${profileRes.body.id}/reviews`)
      .expect(200);

    expect(res.body.items).toBeInstanceOf(Array);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].rating).toBe(4);
  });

  it('should update averageRating on DriverProfile after review', async () => {
    const employer = await registerEmployer();
    const driver = await registerUser();

    const jobRes = await request(getApp().getHttpServer())
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send(validJob)
      .expect(201);

    const profileRes = await request(getApp().getHttpServer())
      .post('/api/jobs/driver-profile')
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send(validDriverProfile)
      .expect(201);

    const appRes = await request(getApp().getHttpServer())
      .post(`/api/jobs/${jobRes.body.id}/apply`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ message: 'test' })
      .expect(201);

    await request(getApp().getHttpServer())
      .patch(`/api/jobs/applications/${appRes.body.id}`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send({ status: 'ACCEPTED' })
      .expect(200);

    await request(getApp().getHttpServer())
      .post('/api/reviews')
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send({
        rating: 4,
        entityType: 'DRIVER_PROFILE',
        entityId: profileRes.body.id,
        revieweeId: driver.user.id,
      })
      .expect(201);

    // Check profile was updated
    const profileCheck = await request(getApp().getHttpServer())
      .get(`/api/jobs/drivers/${profileRes.body.id}`)
      .expect(200);

    expect(profileCheck.body.averageRating).toBe(4);
    expect(profileCheck.body.reviewCount).toBe(1);
  });
});
