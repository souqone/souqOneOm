import { Controller, Get, Module, Req } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ThrottlerModule, Throttle } from '@nestjs/throttler';
import request from 'supertest';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { CustomThrottlerGuard, resolveThrottleIdentity } from '../custom-throttler.guard';
import { getJwtSecret, getJwtPreviousSecret } from '../../../config/jwt.config';

@Controller('test-throttler-identity')
class TestThrottlerIdentityController {
  @Get('limited')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  getLimited(@Req() req: Request) {
    return { ok: true, identity: (req as any)._throttleIdentity, ip: req.ip };
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }]),
  ],
  controllers: [TestThrottlerIdentityController],
  providers: [
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
  ],
})
class TestThrottlerIdentityModule {}

function base64UrlEncode(obj: any): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

describe('CustomThrottlerGuard Identity Hardening (Task B1e)', () => {
  let app: NestExpressApplication;
  const originalEnv = { ...process.env };
  const currentSecret = getJwtSecret();
  const testPreviousSecret = 'previous-valid-jwt-secret-with-at-least-32-characters!';

  beforeAll(async () => {
    process.env.JWT_PREVIOUS_SECRET = testPreviousSecret;
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [TestThrottlerIdentityModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.set('trust proxy', 1);
    await app.init();
  });

  afterAll(async () => {
    process.env = originalEnv;
    await app.close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Direct Unit Tests for resolveThrottleIdentity helper
  // ═══════════════════════════════════════════════════════════════════════════
  describe('resolveThrottleIdentity() unit tests', () => {
    it('should return cached identity if req._throttleIdentity is already a string', () => {
      const fakeReq = { _throttleIdentity: 'user-cached-123', ip: '1.2.3.4' };
      expect(resolveThrottleIdentity(fakeReq)).toBe('user-cached-123');
    });

    it('should fall back to IP if Authorization header exceeds 2048 characters', () => {
      const longHeader = 'Bearer ' + 'a'.repeat(2045);
      const fakeReq = { headers: { authorization: longHeader }, ip: '1.2.3.4' };
      expect(resolveThrottleIdentity(fakeReq)).toBe('ip-1.2.3.4');
    });

    it('should fall back to IP if Authorization header has extra spaces or malformed format', () => {
      const fakeReqDoubleSpace = { headers: { authorization: 'Bearer  token123' }, ip: '1.2.3.4' };
      expect(resolveThrottleIdentity(fakeReqDoubleSpace)).toBe('ip-1.2.3.4');

      const fakeReqTrailing = { headers: { authorization: 'Bearer token123 extra' }, ip: '1.2.3.4' };
      expect(resolveThrottleIdentity(fakeReqTrailing)).toBe('ip-1.2.3.4');

      const fakeReqLowercase = { headers: { authorization: 'bearer token123' }, ip: '1.2.3.4' };
      expect(resolveThrottleIdentity(fakeReqLowercase)).toBe('ip-1.2.3.4');
    });

    it('should fall back to IP if token signature is valid but sub is missing or empty', () => {
      const tokenNoSub = jwt.sign({}, currentSecret, { algorithm: 'HS256' });
      const fakeReqNoSub = { headers: { authorization: `Bearer ${tokenNoSub}` }, ip: '1.2.3.4' };
      expect(resolveThrottleIdentity(fakeReqNoSub)).toBe('ip-1.2.3.4');

      const tokenEmptySub = jwt.sign({ sub: '   ' }, currentSecret, { algorithm: 'HS256' });
      const fakeReqEmptySub = { headers: { authorization: `Bearer ${tokenEmptySub}` }, ip: '1.2.3.4' };
      expect(resolveThrottleIdentity(fakeReqEmptySub)).toBe('ip-1.2.3.4');
    });

    it('should fall back to IP if token signature is valid but sub is an object or array', () => {
      const tokenObjSub = jwt.sign({ sub: { nested: 'obj' } as any }, currentSecret, { algorithm: 'HS256' });
      const fakeReqObjSub = { headers: { authorization: `Bearer ${tokenObjSub}` }, ip: '1.2.3.4' };
      expect(resolveThrottleIdentity(fakeReqObjSub)).toBe('ip-1.2.3.4');

      const tokenArrSub = jwt.sign({ sub: ['arr1', 'arr2'] as any }, currentSecret, { algorithm: 'HS256' });
      const fakeReqArrSub = { headers: { authorization: `Bearer ${tokenArrSub}` }, ip: '1.2.3.4' };
      expect(resolveThrottleIdentity(fakeReqArrSub)).toBe('ip-1.2.3.4');
    });

    it('should fall back to IP if token signature is valid but sub exceeds 64 characters', () => {
      const longSub = 'u'.repeat(65);
      const tokenLongSub = jwt.sign({ sub: longSub }, currentSecret, { algorithm: 'HS256' });
      const fakeReq = { headers: { authorization: `Bearer ${tokenLongSub}` }, ip: '1.2.3.4' };
      expect(resolveThrottleIdentity(fakeReq)).toBe('ip-1.2.3.4');
    });

    it('should resolve to user-<sub> when sub is valid string <= 64 chars or finite number', () => {
      const tokenValidStr = jwt.sign({ sub: 'valid-user-uuid-123' }, currentSecret, { algorithm: 'HS256' });
      const fakeReqStr = { headers: { authorization: `Bearer ${tokenValidStr}` }, ip: '1.2.3.4' };
      expect(resolveThrottleIdentity(fakeReqStr)).toBe('user-valid-user-uuid-123');

      const tokenValidNum = jwt.sign({ sub: 98765 as any }, currentSecret, { algorithm: 'HS256' });
      const fakeReqNum = { headers: { authorization: `Bearer ${tokenValidNum}` }, ip: '1.2.3.4' };
      expect(resolveThrottleIdentity(fakeReqNum)).toBe('user-98765');
    });

    it('should resolve to user-<sub> with JWT_PREVIOUS_SECRET during key rotation', () => {
      const tokenPrev = jwt.sign({ sub: 'prev-user-456' }, testPreviousSecret, { algorithm: 'HS256' });
      const fakeReq = { headers: { authorization: `Bearer ${tokenPrev}` }, ip: '1.2.3.4' };
      expect(resolveThrottleIdentity(fakeReq)).toBe('user-prev-user-456');
    });

    it('should fall back to IP when token is expired', () => {
      const expiredToken = jwt.sign({ sub: 'user-expired' }, currentSecret, { algorithm: 'HS256', expiresIn: -10 });
      const fakeReq = { headers: { authorization: `Bearer ${expiredToken}` }, ip: '1.2.3.4' };
      expect(resolveThrottleIdentity(fakeReq)).toBe('ip-1.2.3.4');
    });

    it('should cache resolved identity on req._throttleIdentity only after decision is complete', () => {
      const fakeReq: Record<string, any> = { ip: '5.6.7.8' };
      const identity = resolveThrottleIdentity(fakeReq);
      expect(identity).toBe('ip-5.6.7.8');
      expect(fakeReq._throttleIdentity).toBe('ip-5.6.7.8');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Integration HTTP Throttler Tests (Full Guard + Rate Limiting Pipeline)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('HTTP Throttling & Bucket Isolation', () => {
    const fixedClientIp = '198.51.100.220';

    it('2.b RE-RUN ATTACK SCENARIO: 8 forged unsigned tokens now share ONE IP bucket and hit 429 starting at req 6', async () => {
      const statuses: number[] = [];
      for (let i = 1; i <= 8; i++) {
        const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
        const payload = base64UrlEncode({ sub: `forged_attacker_${i}` });
        const fakeSig = `fake_signature_${i}`;
        const forgedToken = `${header}.${payload}.${fakeSig}`;

        const res = await request(app.getHttpServer())
          .get('/test-throttler-identity/limited')
          .set('X-Forwarded-For', fixedClientIp)
          .set('Authorization', `Bearer ${forgedToken}`);
        statuses.push(res.status);
      }

      // Proves the bypass is completely eliminated: 5 allowed, then 429 on requests 6, 7, 8!
      expect(statuses).toEqual([200, 200, 200, 200, 200, 429, 429, 429]);
    });

    it('alg:none tokens fall back to IP bucket and get 429 when IP bucket is full', async () => {
      const header = base64UrlEncode({ alg: 'none', typ: 'JWT' });
      const payload = base64UrlEncode({ sub: 'none_user' });
      const algNoneToken = `${header}.${payload}.`;

      const res = await request(app.getHttpServer())
        .get('/test-throttler-identity/limited')
        .set('X-Forwarded-For', fixedClientIp)
        .set('Authorization', `Bearer ${algNoneToken}`);

      // Since fixedClientIp is already exhausted from previous test, alg:none token is immediately 429
      expect(res.status).toBe(429);
    });

    it('wrong-secret tokens fall back to IP bucket and get 429 when IP bucket is full', async () => {
      const wrongSecToken = jwt.sign({ sub: 'wrong_sec_user' }, 'completely_unrecognized_secret');

      const res = await request(app.getHttpServer())
        .get('/test-throttler-identity/limited')
        .set('X-Forwarded-For', fixedClientIp)
        .set('Authorization', `Bearer ${wrongSecToken}`);

      expect(res.status).toBe(429);
    });

    it('two valid users on the SAME IP do not exhaust each other (separate user buckets)', async () => {
      const sharedCarrierIp = '178.85.100.55'; // Representative OmanTel / Ooredoo mobile IP
      const tokenUserA = jwt.sign({ sub: 'valid_user_alpha' }, currentSecret, { algorithm: 'HS256' });
      const tokenUserB = jwt.sign({ sub: 'valid_user_beta' }, currentSecret, { algorithm: 'HS256' });

      // User A exhausts all 5 requests
      for (let i = 0; i < 5; i++) {
        const resA = await request(app.getHttpServer())
          .get('/test-throttler-identity/limited')
          .set('X-Forwarded-For', sharedCarrierIp)
          .set('Authorization', `Bearer ${tokenUserA}`);
        expect(resA.status).toBe(200);
      }

      // User A's 6th request is throttled (user-valid_user_alpha bucket exhausted)
      const resA6 = await request(app.getHttpServer())
        .get('/test-throttler-identity/limited')
        .set('X-Forwarded-For', sharedCarrierIp)
        .set('Authorization', `Bearer ${tokenUserA}`);
      expect(resA6.status).toBe(429);

      // User B makes request from the EXACT SAME IP and succeeds because User B has their own user bucket!
      const resB1 = await request(app.getHttpServer())
        .get('/test-throttler-identity/limited')
        .set('X-Forwarded-For', sharedCarrierIp)
        .set('Authorization', `Bearer ${tokenUserB}`);
      expect(resB1.status).toBe(200);
    });

    it('valid user with JWT_PREVIOUS_SECRET receives their own user bucket', async () => {
      const separateIp = '198.51.100.225';
      const tokenPrev = jwt.sign({ sub: 'user_rotated_key' }, testPreviousSecret, { algorithm: 'HS256' });

      const res = await request(app.getHttpServer())
        .get('/test-throttler-identity/limited')
        .set('X-Forwarded-For', separateIp)
        .set('Authorization', `Bearer ${tokenPrev}`);

      expect(res.status).toBe(200);
      expect(res.body.identity).toBe('user-user_rotated_key');
    });

    it('expired token falls into IP bucket and does not receive user bucket', async () => {
      const separateIp = '198.51.100.226';
      const tokenExpired = jwt.sign({ sub: 'user_expired_sub' }, currentSecret, { algorithm: 'HS256', expiresIn: -30 });

      const res = await request(app.getHttpServer())
        .get('/test-throttler-identity/limited')
        .set('X-Forwarded-For', separateIp)
        .set('Authorization', `Bearer ${tokenExpired}`);

      expect(res.status).toBe(200);
      expect(res.body.identity).toBe(`ip-${separateIp}`);
    });

    it('requests with no Authorization header fall into IP bucket', async () => {
      const separateIp = '198.51.100.227';

      const res = await request(app.getHttpServer())
        .get('/test-throttler-identity/limited')
        .set('X-Forwarded-For', separateIp);

      expect(res.status).toBe(200);
      expect(res.body.identity).toBe(`ip-${separateIp}`);
    });
  });
});
