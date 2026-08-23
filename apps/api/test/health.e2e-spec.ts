import request from 'supertest';
import { createTestApp, closeTestApp, getApp } from './setup';

beforeAll(async () => {
  await createTestApp();
});

afterAll(async () => {
  await closeTestApp();
});

describe('Health API (e2e)', () => {
  describe('GET /health/live', () => {
    it('should return 200 OK for basic liveness', async () => {
      const res = await request(getApp().getHttpServer())
        .get('/health/live')
        .expect(200);

      expect(res.body.status).toBe('up');
    });
  });

  describe('GET /health/ready', () => {
    it('should return 200 OK when all dependencies are up', async () => {
      // In E2E tests, Prisma, Redis, and (mocked or real) MeiliSearch should be up
      const res = await request(getApp().getHttpServer())
        .get('/health/ready')
        .expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.info).toBeDefined();
      expect(res.body.info.database.status).toBe('up');
      expect(res.body.info.redis.status).toBe('up');
      // Meilisearch check might be down depending on test env setup, 
      // but assuming it returns 'up' in standard E2E passing environment.
    });
  });
});
