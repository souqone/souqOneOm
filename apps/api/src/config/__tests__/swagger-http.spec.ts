import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupSwagger } from '../swagger.config';

@Controller('dummy')
class DummyController {
  @Get('hello')
  hello() {
    return { status: 'ok' };
  }
}

describe('Swagger HTTP Security & Routing (Production vs Development)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('NODE_ENV=production', () => {
    let app: INestApplication;

    beforeAll(async () => {
      process.env.NODE_ENV = 'production';

      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [DummyController],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('api');

      // Call setupSwagger - must refuse to mount in production
      setupSwagger(app);

      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /docs must return 404 in production', async () => {
      await request(app.getHttpServer()).get('/docs').expect(404);
    });

    it('GET /api/docs must return 404 in production', async () => {
      await request(app.getHttpServer()).get('/api/docs').expect(404);
    });

    it('GET /api/docs-json must return 404 in production', async () => {
      await request(app.getHttpServer()).get('/api/docs-json').expect(404);
    });

    it('GET /api/v1/docs must return 404 in production', async () => {
      await request(app.getHttpServer()).get('/api/v1/docs').expect(404);
    });
  });

  describe('NODE_ENV=development', () => {
    let app: INestApplication;

    beforeAll(async () => {
      process.env.NODE_ENV = 'development';
      process.env.SWAGGER_ENABLED = 'true';

      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [DummyController],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('api');

      setupSwagger(app);

      await app.init();
    });

    afterAll(async () => {
      delete process.env.SWAGGER_ENABLED;
      await app.close();
    });


    it('GET /api/docs-json must return 200 with OpenAPI JSON in development', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      expect(res.body.openapi || res.body.swagger).toBeDefined();
      expect(res.body.info.title).toBe('CarOne API');
    });

    it('GET /api/docs must be accessible (200 or 301/302 redirect) in development', async () => {
      const res = await request(app.getHttpServer()).get('/api/docs');
      expect([200, 301, 302]).toContain(res.status);
    });

    it('GET /api/docs/ must return 200 HTML in development', async () => {
      const res = await request(app.getHttpServer()).get('/api/docs/').expect(200);
      expect(res.text).toContain('swagger-ui');
    });

    it('GET /docs/ must return 200 HTML in development', async () => {
      const res = await request(app.getHttpServer()).get('/docs/').expect(200);
      expect(res.text).toContain('swagger-ui');
    });

    it('GET /api/v1/docs must still return 404 (unmounted endpoint)', async () => {
      await request(app.getHttpServer()).get('/api/v1/docs').expect(404);
    });
  });
});
