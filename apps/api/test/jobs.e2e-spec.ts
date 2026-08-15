import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validJob = {
  title: 'Looking for experienced truck driver',
  description: 'We need an experienced truck driver for long-haul routes between cities',
  jobType: 'HIRING',
  employmentType: 'FULL_TIME',
  salary: 800,
  salaryPeriod: 'MONTHLY',
  experienceYears: 3,
  governorateId: 1,
  wilayaId: 1,
  contactPhone: '+96899556677',
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

async function registerDriver() {
  const user = await registerUser();
  await request(getApp().getHttpServer())
    .post('/api/jobs/driver-profile')
    .set('Authorization', `Bearer ${user.accessToken}`)
    .send({
      licenseTypes: ['HEAVY'],
      governorateId: 1,
      wilayaId: 1,
    });
  return user;
}

describe('Jobs API (e2e)', () => {
  describe('POST /api/jobs', () => {
    it('should create a job', async () => {
      const { accessToken } = await registerEmployer();
      const res = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validJob)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.jobType).toBe('HIRING');
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/jobs')
        .send(validJob)
        .expect(401);
    });

    it('should reject invalid jobType', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...validJob, jobType: 'INVALID' })
        .expect(400);
    });
  });

  describe('GET /api/jobs', () => {
    it('should list jobs', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/jobs')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });

    it('should filter by jobType', async () => {
      const { accessToken } = await registerEmployer();
      await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validJob);

      const res = await request(getApp().getHttpServer())
        .get('/api/jobs?jobType=HIRING')
        .expect(200);

      res.body.items.forEach((j: any) => expect(j.jobType).toBe('HIRING'));
    });

    it('should support search', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/api/jobs?search=truck')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/jobs/:id', () => {
    it('should return job by id', async () => {
      const { accessToken } = await registerEmployer();
      const created = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validJob);

      const res = await request(getApp().getHttpServer())
        .get(`/api/jobs/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('should 404 for non-existent job', async () => {
      await request(getApp().getHttpServer())
        .get('/api/jobs/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should include poster info', async () => {
      const { accessToken } = await registerEmployer();
      const created = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validJob);

      const res = await request(getApp().getHttpServer())
        .get(`/api/jobs/${created.body.id}`)
        .expect(200);

      expect(res.body.user || res.body.poster).toBeDefined();
    });
  });

  describe('DELETE /api/jobs/:id', () => {
    it('should delete own job', async () => {
      const { accessToken } = await registerEmployer();
      const created = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validJob);

      await request(getApp().getHttpServer())
        .delete(`/api/jobs/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject delete by other user', async () => {
      const user1 = await registerEmployer();
      const user2 = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(validJob);

      await request(getApp().getHttpServer())
        .delete(`/api/jobs/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(403);
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .delete('/api/jobs/some-id')
        .expect(401);
    });
  });

  // ─── Status Toggle ───
  describe('PATCH /api/jobs/:id (status toggle)', () => {
    it('should toggle status to CLOSED', async () => {
      const { accessToken } = await registerEmployer();
      const created = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validJob)
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .patch(`/api/jobs/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'CLOSED' })
        .expect(200);

      expect(res.body.status).toBe('CLOSED');
    });

    it('should reject reopening a CLOSED job', async () => {
      const { accessToken } = await registerEmployer();
      const created = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validJob)
        .expect(201);

      await request(getApp().getHttpServer())
        .patch(`/api/jobs/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'CLOSED' })
        .expect(200);

      await request(getApp().getHttpServer())
        .patch(`/api/jobs/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'ACTIVE' })
        .expect(400);
    });

    it('should reject EXPIRED status via update', async () => {
      const { accessToken } = await registerEmployer();
      const created = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validJob)
        .expect(201);

      await request(getApp().getHttpServer())
        .patch(`/api/jobs/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'EXPIRED' })
        .expect(400);
    });
  });

  // ─── My Jobs ───
  describe('GET /api/jobs/my', () => {
    it('should return paginated response with items and meta', async () => {
      const { accessToken } = await registerEmployer();
      await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validJob)
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .get('/api/jobs/my')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
      expect(res.body.items[0].id).toBeDefined();
    });

    it('should reject without auth', async () => {
      await request(getApp().getHttpServer())
        .get('/api/jobs/my')
        .expect(401);
    });
  });

  // ─── Apply + Withdraw ───
  describe('Application flow', () => {
    it('should apply to a job', async () => {
      const owner = await registerEmployer();
      const applicant = await registerDriver();

      const job = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(validJob)
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .post(`/api/jobs/${job.body.id}/apply`)
        .set('Authorization', `Bearer ${applicant.accessToken}`)
        .send({ message: 'I am interested' })
        .expect(201);

      expect(res.body.status).toBe('PENDING');
      expect(res.body.applicantId).toBe(applicant.user.id);
    });

    it('should reject duplicate application', async () => {
      const owner = await registerEmployer();
      const applicant = await registerDriver();

      const job = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(validJob)
        .expect(201);

      await request(getApp().getHttpServer())
        .post(`/api/jobs/${job.body.id}/apply`)
        .set('Authorization', `Bearer ${applicant.accessToken}`)
        .send({ message: 'First apply' })
        .expect(201);

      await request(getApp().getHttpServer())
        .post(`/api/jobs/${job.body.id}/apply`)
        .set('Authorization', `Bearer ${applicant.accessToken}`)
        .send({ message: 'Second apply' })
        .expect(409);
    });

    it('should reject self-application', async () => {
      const owner = await registerEmployer();

      const job = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(validJob)
        .expect(201);

      await request(getApp().getHttpServer())
        .post(`/api/jobs/${job.body.id}/apply`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ message: 'Self apply' })
        .expect(403);
    });

    it('should withdraw own application', async () => {
      const owner = await registerEmployer();
      const applicant = await registerDriver();

      const job = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(validJob)
        .expect(201);

      const application = await request(getApp().getHttpServer())
        .post(`/api/jobs/${job.body.id}/apply`)
        .set('Authorization', `Bearer ${applicant.accessToken}`)
        .send({ message: 'I want to work' })
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .post(`/api/jobs/applications/${application.body.id}/withdraw`)
        .set('Authorization', `Bearer ${applicant.accessToken}`)
        .expect(201);

      expect(res.body.status).toBe('WITHDRAWN');
    });

    it('should reject withdraw by non-applicant', async () => {
      const owner = await registerEmployer();
      const applicant = await registerDriver();
      const other = await registerUser();

      const job = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(validJob)
        .expect(201);

      const application = await request(getApp().getHttpServer())
        .post(`/api/jobs/${job.body.id}/apply`)
        .set('Authorization', `Bearer ${applicant.accessToken}`)
        .send({ message: 'Hello' })
        .expect(201);

      await request(getApp().getHttpServer())
        .post(`/api/jobs/applications/${application.body.id}/withdraw`)
        .set('Authorization', `Bearer ${other.accessToken}`)
        .expect(403);
    });

    it('should reject withdraw of non-PENDING application', async () => {
      const owner = await registerEmployer();
      const applicant = await registerDriver();

      const job = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(validJob)
        .expect(201);

      const application = await request(getApp().getHttpServer())
        .post(`/api/jobs/${job.body.id}/apply`)
        .set('Authorization', `Bearer ${applicant.accessToken}`)
        .send({ message: 'Test' })
        .expect(201);

      // Owner accepts first
      await request(getApp().getHttpServer())
        .patch(`/api/jobs/applications/${application.body.id}`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send({ status: 'ACCEPTED' })
        .expect(200);

      // Now try to withdraw — should fail
      await request(getApp().getHttpServer())
        .post(`/api/jobs/applications/${application.body.id}/withdraw`)
        .set('Authorization', `Bearer ${applicant.accessToken}`)
        .expect(400);
    });

    it('should get applications for own job', async () => {
      const owner = await registerEmployer();
      const applicant = await registerDriver();

      const job = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(validJob)
        .expect(201);

      await request(getApp().getHttpServer())
        .post(`/api/jobs/${job.body.id}/apply`)
        .set('Authorization', `Bearer ${applicant.accessToken}`)
        .send({ message: 'Test app' })
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .get(`/api/jobs/${job.body.id}/applications`)
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].applicant).toBeDefined();
    });

    it('should reject getting applications by non-owner', async () => {
      const owner = await registerEmployer();
      const other = await registerUser();

      const job = await request(getApp().getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .send(validJob)
        .expect(201);

      await request(getApp().getHttpServer())
        .get(`/api/jobs/${job.body.id}/applications`)
        .set('Authorization', `Bearer ${other.accessToken}`)
        .expect(404);
    });
  });
});
