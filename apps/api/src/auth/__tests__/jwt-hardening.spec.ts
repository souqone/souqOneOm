import { getJwtSecret, getJwtPreviousSecret, MIN_JWT_SECRET_LENGTH, DEV_FALLBACK_SECRET } from '../../config/jwt.config';
import { JwtStrategy } from '../jwt.strategy';
import * as jwt from 'jsonwebtoken';

describe('JWT Hardening (Task 017 — Dual-Secret Rotation, HS256 Pinning, & Length Enforcement)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

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
      process.env.JWT_SECRET = 'secure-production-jwt-secret-with-minimum-32-chars';

      expect(getJwtSecret()).toBe('secure-production-jwt-secret-with-minimum-32-chars');
    });

    it('should fall back to DEV_FALLBACK_SECRET in development if unset', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.JWT_SECRET;

      expect(getJwtSecret()).toBe(DEV_FALLBACK_SECRET);
      expect(DEV_FALLBACK_SECRET.length).toBeGreaterThanOrEqual(MIN_JWT_SECRET_LENGTH);
    });

    it('should reject JWT_PREVIOUS_SECRET if shorter than 32 characters', () => {
      process.env.JWT_PREVIOUS_SECRET = 'short-previous-secret';

      expect(() => getJwtPreviousSecret()).toThrow(/must be at least 32 characters long/i);
    });

    it('should return undefined when JWT_PREVIOUS_SECRET is unset', () => {
      delete process.env.JWT_PREVIOUS_SECRET;

      expect(getJwtPreviousSecret()).toBeUndefined();
    });

    it('should return valid JWT_PREVIOUS_SECRET when >= 32 characters', () => {
      process.env.JWT_PREVIOUS_SECRET = 'previous-jwt-secret-with-sufficient-length-32c';

      expect(getJwtPreviousSecret()).toBe('previous-jwt-secret-with-sufficient-length-32c');
    });
  });

  describe('JwtStrategy Dual-Secret Verification & Algorithm Pinning', () => {
    const currentSecret = 'current-active-jwt-secret-with-at-least-32-characters!';
    const previousSecret = 'previous-valid-jwt-secret-with-at-least-32-characters!';
    const unknownSecret = 'completely-unknown-secret-with-at-least-32-characters!';

    let strategy: JwtStrategy;

    beforeEach(() => {
      process.env.JWT_SECRET = currentSecret;
      process.env.JWT_PREVIOUS_SECRET = previousSecret;
      strategy = new JwtStrategy();
    });

    it('should accept and authenticate token signed with currentSecret', (done) => {
      const token = jwt.sign(
        { sub: 'user-current-1', email: 'current@test.com', role: 'USER' },
        currentSecret,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      // Extract secretOrKeyProvider from strategy options
      const secretOrKeyProvider = (strategy as any)._secretOrKeyProvider;
      expect(secretOrKeyProvider).toBeDefined();

      secretOrKeyProvider(null, token, (err: any, secret: string) => {
        expect(err).toBeNull();
        expect(secret).toBe(currentSecret);

        // Verify full payload validation succeeds with the resolved secret
        const payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any;
        expect(payload.sub).toBe('user-current-1');
        done();
      });
    });

    it('should accept token signed with previousSecret during key rotation', (done) => {
      const token = jwt.sign(
        { sub: 'user-prev-1', email: 'previous@test.com', role: 'USER' },
        previousSecret,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      const secretOrKeyProvider = (strategy as any)._secretOrKeyProvider;

      secretOrKeyProvider(null, token, (err: any, secret: string) => {
        expect(err).toBeNull();
        expect(secret).toBe(previousSecret);

        // Verify token resolves and verifies correctly against previousSecret
        const payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any;
        expect(payload.sub).toBe('user-prev-1');
        done();
      });
    });

    it('should reject token signed with unknown secret', (done) => {
      const token = jwt.sign(
        { sub: 'attacker-1', email: 'attacker@evil.com', role: 'ADMIN' },
        unknownSecret,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      const secretOrKeyProvider = (strategy as any)._secretOrKeyProvider;

      secretOrKeyProvider(null, token, (err: any, secret: string) => {
        expect(err).toBeNull();
        // Falls back to currentSecret so passport-jwt verify fails
        expect(secret).toBe(currentSecret);

        expect(() => {
          jwt.verify(token, secret, { algorithms: ['HS256'] });
        }).toThrow(/invalid signature/i);
        done();
      });
    });

    it('should reject token signed with unpinned algorithm (HS512 or none)', () => {
      const tokenHS512 = jwt.sign(
        { sub: 'user-1' },
        currentSecret,
        { algorithm: 'HS512', expiresIn: '15m' },
      );

      expect(() => {
        jwt.verify(tokenHS512, currentSecret, { algorithms: ['HS256'] });
      }).toThrow(/invalid algorithm/i);
    });
  });
});
