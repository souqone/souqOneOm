import request from 'supertest';
import { createTestApp, closeTestApp, getApp, registerUser } from './setup';

beforeAll(async () => { await createTestApp(); });
afterAll(async () => { await closeTestApp(); });

const validDriverProfile = {
  licenseTypes: ['HEAVY'],
  experienceYears: 5,
  languages: ['ARABIC', 'ENGLISH'],
  nationality: 'Omani',
  vehicleTypes: ['HEAVY_TRUCK'],
  hasOwnVehicle: true,
  bio: 'سائق محترف بخبرة طويلة في النقل الثقيل',
  governorateId: 1,
  wilayaId: 1,
  contactPhone: '+96899001122',
};

const validEmployerProfile = {
  companyName: 'شركة النقل المتحدة',
  companySize: 'MEDIUM',
  industry: 'نقل ولوجستيات',
  bio: 'شركة متخصصة في خدمات النقل والشحن',
  governorateId: 1,
  wilayaId: 1,
  contactPhone: '+96899003344',
};

describe('Jobs Profiles API (e2e)', () => {
  // ─── Driver Profile ───
  describe('Driver Profile', () => {
    it('should create a driver profile', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/jobs/driver-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validDriverProfile)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.licenseTypes).toContain('HEAVY');
      expect(res.body.governorateRef.nameEn).toBe('Muscat');
    });

    it('should reject duplicate driver profile', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/jobs/driver-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validDriverProfile)
        .expect(201);

      await request(getApp().getHttpServer())
        .post('/api/jobs/driver-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validDriverProfile)
        .expect(409);
    });

    it('should get my driver profile', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/jobs/driver-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validDriverProfile)
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .get('/api/jobs/driver-profile/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.governorateRef.nameEn).toBe('Muscat');
    });

    it('should return 404 if no driver profile', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .get('/api/jobs/driver-profile/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should update driver profile', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/jobs/driver-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validDriverProfile)
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .patch('/api/jobs/driver-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ isAvailable: false })
        .expect(200);

      expect(res.body.isAvailable).toBe(false);
    });

    it('should list drivers', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/jobs/driver-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validDriverProfile)
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .get('/api/jobs/drivers')
        .expect(200);

      expect(res.body.items).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });

    it('should get driver by id', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/jobs/driver-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validDriverProfile)
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .get(`/api/jobs/drivers/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
      expect(res.body.user).toBeDefined();
    });

    it('should filter drivers by governorateId', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/jobs/driver-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validDriverProfile)
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .get('/api/jobs/drivers?governorateId=1')
        .expect(200);

      res.body.items.forEach((d: any) => expect(d.governorateId).toBe(1));
    });

    it('should require auth for profile creation', async () => {
      await request(getApp().getHttpServer())
        .post('/api/jobs/driver-profile')
        .send(validDriverProfile)
        .expect(401);
    });
  });

  // ─── Employer Profile ───
  describe('Employer Profile', () => {
    it('should create an employer profile', async () => {
      const { accessToken } = await registerUser();
      const res = await request(getApp().getHttpServer())
        .post('/api/jobs/employer-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validEmployerProfile)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.companyName).toBe('شركة النقل المتحدة');
    });

    it('should reject duplicate employer profile', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/jobs/employer-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validEmployerProfile)
        .expect(201);

      await request(getApp().getHttpServer())
        .post('/api/jobs/employer-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validEmployerProfile)
        .expect(409);
    });

    it('should get my employer profile', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/jobs/employer-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validEmployerProfile)
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .get('/api/jobs/employer-profile/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.companyName).toBe('شركة النقل المتحدة');
    });

    it('should update employer profile', async () => {
      const { accessToken } = await registerUser();
      await request(getApp().getHttpServer())
        .post('/api/jobs/employer-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validEmployerProfile)
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .patch('/api/jobs/employer-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ companyName: 'شركة التوصيل السريع' })
        .expect(200);

      expect(res.body.companyName).toBe('شركة التوصيل السريع');
    });

    it('should get employer by id', async () => {
      const { accessToken } = await registerUser();
      const created = await request(getApp().getHttpServer())
        .post('/api/jobs/employer-profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validEmployerProfile)
        .expect(201);

      const res = await request(getApp().getHttpServer())
        .get(`/api/jobs/employers/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('should require auth', async () => {
      await request(getApp().getHttpServer())
        .post('/api/jobs/employer-profile')
        .send(validEmployerProfile)
        .expect(401);
    });
  });
});
