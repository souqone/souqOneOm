import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule, Throttle } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { CustomThrottlerGuard } from '../src/common/guards/custom-throttler.guard';

@Controller('test-a')
class TestAController {
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Get()
  getA() {
    return { ok: true };
  }
}

@Controller('test-b')
class TestBController {
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Get()
  getB() {
    return { ok: true };
  }
}

describe('CustomThrottlerGuard (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
      ],
      controllers: [TestAController, TestBController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: CustomThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should scope rate limits independently per endpoint', async () => {
    // Hit endpoint A up to its limit (3 requests)
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .get('/test-a')
        .set('x-forwarded-for', '127.0.0.99') // Mock IP
        .expect(200);
    }

    // 4th request to A should fail with 429
    await request(app.getHttpServer())
      .get('/test-a')
      .set('x-forwarded-for', '127.0.0.99')
      .expect(429);

    // BUT endpoint B should still be fully accessible because it has an independent limit
    await request(app.getHttpServer())
      .get('/test-b')
      .set('x-forwarded-for', '127.0.0.99')
      .expect(200);
  });
});