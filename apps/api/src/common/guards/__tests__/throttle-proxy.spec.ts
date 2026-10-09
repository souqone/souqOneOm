import { Controller, Get, Module, Req } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ThrottlerModule, Throttle } from '@nestjs/throttler';
import request from 'supertest';
import type { Request } from 'express';
import { CustomThrottlerGuard } from '../custom-throttler.guard';

@Controller('test-throttle-proxy')
class TestThrottleProxyController {
  @Get('limited')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  getLimited(@Req() req: Request) {
    return { ok: true, ip: req.ip };
  }

  @Get('inspect-ip')
  inspectIp(@Req() req: Request) {
    return { ip: req.ip, ips: req.ips };
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }]),
  ],
  controllers: [TestThrottleProxyController],
  providers: [
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
  ],
})
class TestThrottleProxyModule {}

describe('Proxy & Throttler Hardening (Task B1c — Phase 2.1)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [TestThrottleProxyModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    // Configure trust proxy = 1 (exactly as in main.ts for Railway single-hop reverse proxy)
    app.set('trust proxy', 1);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('req.ip resolution behind single proxy hop', () => {
    it('should resolve req.ip to the client IP from a single X-Forwarded-For header', async () => {
      const res = await request(app.getHttpServer())
        .get('/test-throttle-proxy/inspect-ip')
        .set('X-Forwarded-For', '203.0.113.195');

      expect(res.status).toBe(200);
      expect(res.body.ip).toBe('203.0.113.195');
      expect(res.body.ips).toEqual(['203.0.113.195']);
    });

    it('should ignore client-supplied spoofed IPs and resolve to the proxy-appended real client IP', async () => {
      const res = await request(app.getHttpServer())
        .get('/test-throttle-proxy/inspect-ip')
        .set('X-Forwarded-For', '10.99.99.99, 203.0.113.195');

      expect(res.status).toBe(200);
      expect(res.body.ip).toBe('203.0.113.195');
    });
  });

  describe('Throttler bucket separation across client IPs', () => {
    it('two client IPs get separate buckets and do not exhaust each other', async () => {
      const clientA = '198.51.100.1';
      const clientB = '198.51.100.2';

      // Client A exhausts its 5 allowed requests
      for (let i = 0; i < 5; i++) {
        const resA = await request(app.getHttpServer())
          .get('/test-throttle-proxy/limited')
          .set('X-Forwarded-For', clientA);
        expect(resA.status).toBe(200);
        expect(resA.body.ip).toBe(clientA);
      }

      // Client A's 6th request is throttled
      const resA6 = await request(app.getHttpServer())
        .get('/test-throttle-proxy/limited')
        .set('X-Forwarded-For', clientA);
      expect(resA6.status).toBe(429);

      // Client B makes requests and succeeds because it has its own separate bucket
      const resB = await request(app.getHttpServer())
        .get('/test-throttle-proxy/limited')
        .set('X-Forwarded-For', clientB);
      expect(resB.status).toBe(200);
      expect(resB.body.ip).toBe(clientB);
    });
  });

  describe('Spoofed extra X-Forwarded-For cannot choose its bucket', () => {
    it('attacker cannot evade throttling by varying client-supplied spoofed headers', async () => {
      const attackerRealIp = '198.51.100.77';

      // Attacker attempts 5 requests with differing spoofed IPs prepended to their real IP
      for (let i = 1; i <= 5; i++) {
        const spoofedHeader = `fake.spoofed.${i}, ${attackerRealIp}`;
        const res = await request(app.getHttpServer())
          .get('/test-throttle-proxy/limited')
          .set('X-Forwarded-For', spoofedHeader);

        expect(res.status).toBe(200);
        expect(res.body.ip).toBe(attackerRealIp);
      }

      // Attacker's 6th request with yet another fake IP is still blocked under attackerRealIp's bucket
      const res6 = await request(app.getHttpServer())
        .get('/test-throttle-proxy/limited')
        .set('X-Forwarded-For', `fake.spoofed.6, ${attackerRealIp}`);

      expect(res6.status).toBe(429);
      expect(res6.body.statusCode).toBe(429);
    });
  });
});
