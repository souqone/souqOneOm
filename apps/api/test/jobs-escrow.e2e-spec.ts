import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validJob = {
  title: 'وظيفة اختبار دفع',
  description: 'وظيفة للاختبار',
  jobType: 'HIRING',
  employmentType: 'FULL_TIME',
  governorateId: 1,
  wilayaId: 1,
  licenseTypes: ['HEAVY'],
};

async function setupAcceptedApp() {
  const employer = await registerUser();
  const driver = await registerUser();

  const jobRes = await request(getApp().getHttpServer())
    .post('/api/jobs')
    .set('Authorization', `Bearer ${employer.accessToken}`)
    .send(validJob)
    .expect(201);

  const appRes = await request(getApp().getHttpServer())
    .post(`/api/jobs/${jobRes.body.id}/apply`)
    .set('Authorization', `Bearer ${driver.accessToken}`)
    .send({ coverLetter: 'test' })
    .expect(201);

  await request(getApp().getHttpServer())
    .patch(`/api/jobs/applications/${appRes.body.id}`)
    .set('Authorization', `Bearer ${employer.accessToken}`)
    .send({ status: 'ACCEPTED' })
    .expect(200);

  return { employer, driver, jobId: jobRes.body.id, applicationId: appRes.body.id };
}

describe('Jobs Escrow API (e2e)', () => {
  it('should pay for ACCEPTED application', async () => {
    const { employer, applicationId } = await setupAcceptedApp();

    const res = await request(getApp().getHttpServer())
      .post(`/api/jobs/applications/${applicationId}/pay`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send({ amount: 5000 })
      .expect(201);

    expect(res.body.status).toBe('HELD');
    expect(res.body.amount).toBe(5000);
  });

  it('should reject payment for non-ACCEPTED application', async () => {
    const employer = await registerUser();
    const driver = await registerUser();

    const jobRes = await request(getApp().getHttpServer())
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send(validJob)
      .expect(201);

    const appRes = await request(getApp().getHttpServer())
      .post(`/api/jobs/${jobRes.body.id}/apply`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ coverLetter: 'test' })
      .expect(201);

    await request(getApp().getHttpServer())
      .post(`/api/jobs/applications/${appRes.body.id}/pay`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send({ amount: 5000 })
      .expect(400);
  });

  it('should reject duplicate payment', async () => {
    const { employer, applicationId } = await setupAcceptedApp();

    await request(getApp().getHttpServer())
      .post(`/api/jobs/applications/${applicationId}/pay`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send({ amount: 5000 })
      .expect(201);

    await request(getApp().getHttpServer())
      .post(`/api/jobs/applications/${applicationId}/pay`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send({ amount: 5000 })
      .expect(409);
  });

  it('should release escrow funds', async () => {
    const { employer, applicationId } = await setupAcceptedApp();

    const payRes = await request(getApp().getHttpServer())
      .post(`/api/jobs/applications/${applicationId}/pay`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send({ amount: 5000 })
      .expect(201);

    const releaseRes = await request(getApp().getHttpServer())
      .post(`/api/jobs/escrow/${payRes.body.id}/release`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .expect(201);

    expect(releaseRes.body.status).toBe('RELEASED');
  });

  it('should reject release by non-owner', async () => {
    const { employer, driver, applicationId } = await setupAcceptedApp();

    const payRes = await request(getApp().getHttpServer())
      .post(`/api/jobs/applications/${applicationId}/pay`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send({ amount: 5000 })
      .expect(201);

    await request(getApp().getHttpServer())
      .post(`/api/jobs/escrow/${payRes.body.id}/release`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .expect(403);
  });

  it('should open dispute', async () => {
    const { employer, driver, applicationId } = await setupAcceptedApp();

    const payRes = await request(getApp().getHttpServer())
      .post(`/api/jobs/applications/${applicationId}/pay`)
      .set('Authorization', `Bearer ${employer.accessToken}`)
      .send({ amount: 5000 })
      .expect(201);

    const disputeRes = await request(getApp().getHttpServer())
      .post(`/api/jobs/escrow/${payRes.body.id}/dispute`)
      .set('Authorization', `Bearer ${driver.accessToken}`)
      .send({ reason: 'لم أحصل على العمل' })
      .expect(201);

    expect(disputeRes.body.status).toBe('DISPUTED');
  });
});
