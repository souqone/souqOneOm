import { Controller, Get, INestApplication, UseGuards } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule, AuthGuard } from '@nestjs/passport';
import request from 'supertest';
import * as jwt from 'jsonwebtoken';
import {
  getJwtSecret,
  getJwtPreviousSecret,
  resolveJwtSecretForToken,
  verifyAccessToken,
  MIN_JWT_SECRET_LENGTH,
  DEV_FALLBACK_SECRET,
} from '../../config/jwt.config';
import { JwtStrategy } from '../jwt.strategy';
import { AuthTokenService } from '../auth-token.service';
import { JwtService } from '@nestjs/jwt';

@Controller()
class TestProtectedController {
  @UseGuards(AuthGuard('jwt'))
  @Get('test-protected')
  getProtected() {
    return { ok: true };
  }
}

describe('JWT Hardening & Rotation Suite (Task 017 / B1b Phase 2)', () => {
  const originalEnv = process.env;

  const currentSecret = 'current-active-jwt-secret-with-at-least-32-characters!';
  const previousSecret = 'previous-valid-jwt-secret-with-at-least-32-characters!';
  const unknownSecret = 'completely-unknown-secret-with-at-least-32-characters!';

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Config & Validation (Strict Environment Fallback)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('JWT Config & Validation (getJwtSecret & getJwtPreviousSecret)', () => {
    it('should reject JWT_SECRET in production if missing', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;

      expect(() => getJwtSecret()).toThrow(/JWT_SECRET environment variable is required in production/i);
    });

    it('should reject JWT_SECRET in production if shorter than 32 characters', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'short-secret-less-than-32-chars';

      expect(() => getJwtSecret()).toThrow(/must be at least 32 characters long in production/i);
    });

    it('should reject JWT_SECRET in production if placeholder', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'CHANGE_ME_NOT_A_REAL_SECRET_AT_ALL_32CHARS';

      expect(() => getJwtSecret()).toThrow(/contains an unrunnable placeholder in production/i);
    });

    it('should return valid JWT_SECRET in production when >= 32 characters', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = currentSecret;

      expect(getJwtSecret()).toBe(currentSecret);
    });

    it('should fall back to DEV_FALLBACK_SECRET only when NODE_ENV is development or test', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.JWT_SECRET;
      expect(getJwtSecret()).toBe(DEV_FALLBACK_SECRET);

      process.env.NODE_ENV = 'test';
      delete process.env.JWT_SECRET;
      expect(getJwtSecret()).toBe(DEV_FALLBACK_SECRET);
      expect(DEV_FALLBACK_SECRET.length).toBeGreaterThanOrEqual(MIN_JWT_SECRET_LENGTH);
    });

    it('should throw at boot for non-dev/test environments (unset, staging) when JWT_SECRET is missing or short', () => {
      delete process.env.NODE_ENV;
      delete process.env.JWT_SECRET;
      expect(() => getJwtSecret()).toThrow(/JWT_SECRET environment variable is required/i);

      process.env.NODE_ENV = 'staging';
      delete process.env.JWT_SECRET;
      expect(() => getJwtSecret()).toThrow(/JWT_SECRET environment variable is required/i);

      process.env.NODE_ENV = 'staging';
      process.env.JWT_SECRET = 'short-staging-secret';
      expect(() => getJwtSecret()).toThrow(/must be at least 32 characters long/i);

      process.env.NODE_ENV = 'staging';
      process.env.JWT_SECRET = currentSecret;
      expect(getJwtSecret()).toBe(currentSecret);
    });

    it('should handle getJwtPreviousSecret() correctly across environments', () => {
      delete process.env.JWT_PREVIOUS_SECRET;
      expect(getJwtPreviousSecret()).toBeUndefined();

      process.env.NODE_ENV = 'development';
      process.env.JWT_PREVIOUS_SECRET = 'CHANGE_ME_PLACEHOLDER';
      expect(getJwtPreviousSecret()).toBeUndefined();

      process.env.NODE_ENV = 'production';
      process.env.JWT_PREVIOUS_SECRET = 'short-prev';
      expect(() => getJwtPreviousSecret()).toThrow(/must be at least 32 characters long in production/i);

      process.env.NODE_ENV = 'staging';
      process.env.JWT_PREVIOUS_SECRET = 'CHANGE_ME_STAGING';
      expect(() => getJwtPreviousSecret()).toThrow(/contains an unrunnable placeholder/i);

      process.env.JWT_PREVIOUS_SECRET = previousSecret;
      expect(getJwtPreviousSecret()).toBe(previousSecret);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Real HTTP-Level Tests with Nest TestingModule + supertest
  // ═══════════════════════════════════════════════════════════════════════════
  describe('HTTP-Level Passport JWT Strategy Authentication', () => {
    let app: INestApplication;

    beforeAll(async () => {
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = currentSecret;
      process.env.JWT_PREVIOUS_SECRET = previousSecret;

      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
        controllers: [TestProtectedController],
        providers: [JwtStrategy],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = currentSecret;
      process.env.JWT_PREVIOUS_SECRET = previousSecret;
    });

    afterAll(async () => {
      await app.close();
    });

    it('valid current-secret token -> 200', async () => {
      const token = jwt.sign(
        { sub: 'user-1', email: 'user@test.com', role: 'USER' },
        currentSecret,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      const res = await request(app.getHttpServer())
        .get('/test-protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('valid previous-secret token -> 200', async () => {
      const token = jwt.sign(
        { sub: 'user-prev', email: 'prev@test.com', role: 'USER' },
        previousSecret,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      const res = await request(app.getHttpServer())
        .get('/test-protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('unknown-secret token -> 401', async () => {
      const token = jwt.sign(
        { sub: 'user-evil', email: 'evil@test.com', role: 'ADMIN' },
        unknownSecret,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      const res = await request(app.getHttpServer())
        .get('/test-protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
    });

    it('HS512 token signed with the current secret -> 401', async () => {
      const tokenHS512 = jwt.sign(
        { sub: 'user-1' },
        currentSecret,
        { algorithm: 'HS512', expiresIn: '15m' },
      );

      const res = await request(app.getHttpServer())
        .get('/test-protected')
        .set('Authorization', `Bearer ${tokenHS512}`);

      expect(res.status).toBe(401);
    });

    it('alg:none token -> 401', async () => {
      // Craft an unverified alg:none token
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: 'user-1', role: 'ADMIN' })).toString('base64url');
      const tokenNone = `${header}.${payload}.`;

      const res = await request(app.getHttpServer())
        .get('/test-protected')
        .set('Authorization', `Bearer ${tokenNone}`);

      expect(res.status).toBe(401);
    });

    it('expired token -> 401', async () => {
      const expiredToken = jwt.sign(
        { sub: 'user-expired' },
        currentSecret,
        { algorithm: 'HS256', expiresIn: '-1s' },
      );

      const res = await request(app.getHttpServer())
        .get('/test-protected')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it('previous-secret token when JWT_PREVIOUS_SECRET is NOT set -> 401', async () => {
      // Temporarily unset previous secret
      delete process.env.JWT_PREVIOUS_SECRET;

      const token = jwt.sign(
        { sub: 'user-prev' },
        previousSecret,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      const res = await request(app.getHttpServer())
        .get('/test-protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);

      // Restore
      process.env.JWT_PREVIOUS_SECRET = previousSecret;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Output of signAccessToken() Algorithm Pinning (HS256 in Header)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('signAccessToken() Algorithm Pinning Verification', () => {
    it('should generate access tokens with header alg strictly set to HS256', async () => {
      process.env.JWT_SECRET = currentSecret;

      const jwtService = new JwtService({
        secret: currentSecret,
        signOptions: {
          expiresIn: '15m',
          algorithm: 'HS256',
        },
      });

      const mockPrisma: any = {};
      const authTokenService = new AuthTokenService(mockPrisma, jwtService);

      const mockUser: any = {
        id: 'usr-123',
        email: 'pin@test.com',
        username: 'pintester',
        role: 'USER',
      };

      const token = await authTokenService.signAccessToken(mockUser);
      const decoded = jwt.decode(token, { complete: true });

      expect(decoded).toBeDefined();
      expect(decoded?.header.alg).toBe('HS256');
      expect((decoded?.payload as any).sub).toBe('usr-123');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. WebSocket Verification Helper (verifyAccessToken)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('WebSocket Helper: verifyAccessToken()', () => {
    beforeEach(() => {
      process.env.JWT_SECRET = currentSecret;
      process.env.JWT_PREVIOUS_SECRET = previousSecret;
    });

    it('should accept and decode token signed with current secret', () => {
      const token = jwt.sign({ sub: 'ws-user-1' }, currentSecret, {
        algorithm: 'HS256',
        expiresIn: '15m',
      });

      const payload = verifyAccessToken(token);
      expect(payload.sub).toBe('ws-user-1');
    });

    it('should accept token signed with previous secret when rotation is active', () => {
      const token = jwt.sign({ sub: 'ws-user-prev' }, previousSecret, {
        algorithm: 'HS256',
        expiresIn: '15m',
      });

      const payload = verifyAccessToken(token);
      expect(payload.sub).toBe('ws-user-prev');
    });

    it('should reject token signed with previous secret when JWT_PREVIOUS_SECRET is unset', () => {
      delete process.env.JWT_PREVIOUS_SECRET;

      const token = jwt.sign({ sub: 'ws-user-prev' }, previousSecret, {
        algorithm: 'HS256',
        expiresIn: '15m',
      });

      expect(() => verifyAccessToken(token)).toThrow(/invalid signature/i);
    });

    it('should reject token signed with unknown secret', () => {
      const token = jwt.sign({ sub: 'ws-user-evil' }, unknownSecret, {
        algorithm: 'HS256',
        expiresIn: '15m',
      });

      expect(() => verifyAccessToken(token)).toThrow(/invalid signature/i);
    });

    it('should reject token signed with unpinned algorithm (HS512)', () => {
      const token = jwt.sign({ sub: 'ws-user' }, currentSecret, {
        algorithm: 'HS512',
        expiresIn: '15m',
      });

      expect(() => verifyAccessToken(token)).toThrow(/invalid algorithm/i);
    });

    it('should reject alg:none token', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: 'ws-user' })).toString('base64url');
      const tokenNone = `${header}.${payload}.`;

      expect(() => verifyAccessToken(tokenNone)).toThrow();
    });

    it('should reject expired token', () => {
      const token = jwt.sign({ sub: 'ws-user' }, currentSecret, {
        algorithm: 'HS256',
        expiresIn: '-1s',
      });

      expect(() => verifyAccessToken(token)).toThrow(/jwt expired/i);
    });
  });
});
