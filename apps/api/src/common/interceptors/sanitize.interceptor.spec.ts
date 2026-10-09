import { of } from 'rxjs';
import { SanitizeInterceptor } from './sanitize.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';

describe('SanitizeInterceptor', () => {
  let interceptor: SanitizeInterceptor;

  beforeEach(() => {
    interceptor = new SanitizeInterceptor();
  });

  const mockContext = {} as ExecutionContext;

  it('should strip passwordHash and verification tokens from response', (done) => {
    const rawData = {
      id: 'user-1',
      displayName: 'Ali',
      passwordHash: 'secret-hash-value',
      verificationCode: '123456',
      verificationExpiry: new Date(),
    };

    const next: CallHandler = { handle: () => of(rawData) };

    interceptor.intercept(mockContext, next).subscribe((result: any) => {
      expect(result).toEqual({ id: 'user-1', displayName: 'Ali' });
      expect(result.passwordHash).toBeUndefined();
      expect(result.verificationCode).toBeUndefined();
      done();
    });
  });

  it('should strip emailVerificationCode and emailVerificationExpiry from response', (done) => {
    const rawData = {
      id: 'user-email-test',
      email: 'test@example.com',
      emailVerificationCode: '654321',
      emailVerificationExpiry: new Date(Date.now() + 3600000),
    };

    const next: CallHandler = { handle: () => of(rawData) };

    interceptor.intercept(mockContext, next).subscribe((result: any) => {
      expect(result.id).toBe('user-email-test');
      expect(result.email).toBe('test@example.com');
      expect(result.emailVerificationCode).toBeUndefined();
      expect(result.emailVerificationExpiry).toBeUndefined();
      done();
    });
  });

  it('should strip tokenVersion, password, and refreshTokenHash from response', (done) => {
    const rawData = {
      id: 'user-2',
      displayName: 'Omar',
      password: 'plain-password',
      tokenVersion: 5,
      refreshToken: 'refresh-token-value',
      refreshTokenHash: 'hash-token-value',
    };

    const next: CallHandler = { handle: () => of(rawData) };

    interceptor.intercept(mockContext, next).subscribe((result: any) => {
      expect(result.password).toBeUndefined();
      expect(result.tokenVersion).toBeUndefined();
      expect(result.refreshTokenHash).toBeUndefined();
      expect(result.refreshToken).toBe('refresh-token-value');
      expect(result.id).toBe('user-2');
      expect(result.displayName).toBe('Omar');
      done();
    });
  });

  it('should strip sensitive fields inside nested objects and arrays', (done) => {
    const rawData = {
      bookingId: 'book-1',
      driver: {
        id: 'drv-1',
        user: {
          id: 'u-1',
          displayName: 'Driver 1',
          passwordHash: 'secret-hash',
          tokenVersion: 2,
        },
      },
      passengers: [
        { id: 'p-1', passwordHash: 'hash-p1', tokenVersion: 1 },
        { id: 'p-2', tokenVersion: 0 },
      ],
    };

    const next: CallHandler = { handle: () => of(rawData) };

    interceptor.intercept(mockContext, next).subscribe((result: any) => {
      expect(result.driver.user.passwordHash).toBeUndefined();
      expect(result.driver.user.tokenVersion).toBeUndefined();
      expect(result.passengers[0].passwordHash).toBeUndefined();
      expect(result.passengers[0].tokenVersion).toBeUndefined();
      expect(result.passengers[1].tokenVersion).toBeUndefined();
      expect(result.driver.user.displayName).toBe('Driver 1');
      done();
    });
  });
});
