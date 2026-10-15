import { of } from 'rxjs';
import { SanitizeInterceptor } from './sanitize.interceptor';
import { ExecutionContext, CallHandler, StreamableFile } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';

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

  it('should strip googleId and all sensitive fields from a user object', (done) => {
    const rawUserWithAllSensitives = {
      id: 'u-all-sensitive',
      email: 'sensitive@souqone.om',
      username: 'sens_user',
      displayName: 'Sensitive User',
      googleId: 'google-oauth2-sub-10928374',
      password: 'plain-secret-password',
      passwordHash: '$2a$10$hashedpasswordstring',
      tokenVersion: 3,
      passwordResetCode: '123456',
      passwordResetExpiry: new Date(Date.now() + 60000),
      verificationCode: '654321',
      verificationExpiry: new Date(Date.now() + 60000),
      emailVerificationCode: '987654',
      emailVerificationExpiry: new Date(Date.now() + 60000),
      refreshTokenHash: 'sha256refreshtokenhash',
      secret: 'mfa-totp-secret',
    };

    const next: CallHandler = { handle: () => of(rawUserWithAllSensitives) };

    interceptor.intercept(mockContext, next).subscribe((result: any) => {
      expect(result.googleId).toBeUndefined();
      expect(result.password).toBeUndefined();
      expect(result.passwordHash).toBeUndefined();
      expect(result.tokenVersion).toBeUndefined();
      expect(result.passwordResetCode).toBeUndefined();
      expect(result.passwordResetExpiry).toBeUndefined();
      expect(result.verificationCode).toBeUndefined();
      expect(result.verificationExpiry).toBeUndefined();
      expect(result.emailVerificationCode).toBeUndefined();
      expect(result.emailVerificationExpiry).toBeUndefined();
      expect(result.refreshTokenHash).toBeUndefined();
      expect(result.secret).toBeUndefined();
      expect(result.id).toBe('u-all-sensitive');
      expect(result.email).toBe('sensitive@souqone.om');
      expect(result.username).toBe('sens_user');
      expect(result.displayName).toBe('Sensitive User');
      done();
    });
  });

  it('should strip contactPhone, whatsapp, phoneE164, and phone by default, while preserving whatsappEnabled', (done) => {
    const rawListing = {
      id: 'list-1',
      title: 'Toyota Land Cruiser',
      phone: '+96891234567',
      contactPhone: '91234567',
      whatsapp: '91234567',
      phoneE164: '+96891234567',
      whatsappEnabled: true,
      seller: {
        id: 'u-seller',
        displayName: 'Salim',
        phone: '+96898765432',
        contactPhone: '98765432',
      },
    };

    const next: CallHandler = { handle: () => of(rawListing) };

    interceptor.intercept(mockContext, next).subscribe((result: any) => {
      expect(result.phone).toBeUndefined();
      expect(result.contactPhone).toBeUndefined();
      expect(result.whatsapp).toBeUndefined();
      expect(result.phoneE164).toBeUndefined();
      expect(result.whatsappEnabled).toBe(true);

      expect(result.seller.phone).toBeUndefined();
      expect(result.seller.contactPhone).toBeUndefined();
      expect(result.seller.displayName).toBe('Salim');
      done();
    });
  });

  it('should preserve non-plain objects: Date, Decimal, Buffer, StreamableFile, and custom class instances', (done) => {
    class CustomClass {
      constructor(public secretData: string, public phone: string) {}
    }

    const testDate = new Date('2026-10-15T12:00:00Z');
    const testDecimal = new Prisma.Decimal('12500.500');
    const testBuffer = Buffer.from('hello buffer');
    const testStream = new StreamableFile(Buffer.from('stream data'));
    const testInstance = new CustomClass('keep-secret', '99887766');

    const payload = {
      id: 'item-1',
      createdAt: testDate,
      price: testDecimal,
      buffer: testBuffer,
      file: testStream,
      instance: testInstance,
      phone: '91234567',
    };

    const next: CallHandler = { handle: () => of(payload) };

    interceptor.intercept(mockContext, next).subscribe((result: any) => {
      expect(result.phone).toBeUndefined();
      expect(result.createdAt).toBe(testDate);
      expect(result.createdAt.toISOString()).toBe('2026-10-15T12:00:00.000Z');
      expect(result.price).toBe(testDecimal);
      expect(result.price.toString()).toBe('12500.5');
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
      expect(result.buffer.toString()).toBe('hello buffer');
      expect(result.file).toBe(testStream);
      expect(result.instance).toBe(testInstance);
      expect(result.instance.phone).toBe('99887766'); // Class instance preserved untouched
      done();
    });
  });

  describe('with Reflector and @ExposePhone()', () => {
    it('should expose phone when @ExposePhone() is present, but STILL strip legacy contactPhone, whatsapp, and passwordHash', (done) => {
      const mockReflector = {
        getAllAndOverride: jest.fn().mockReturnValue(true),
      } as unknown as Reflector;

      const exposeInterceptor = new SanitizeInterceptor(mockReflector);

      const fakeHandler = () => {};
      const fakeClass = class {};
      const contextWithHandler = {
        getHandler: () => fakeHandler,
        getClass: () => fakeClass,
      } as unknown as ExecutionContext;

      const userProfile = {
        id: 'u-me',
        displayName: 'Said',
        phone: '+96899112233',
        contactPhone: '99112233',
        whatsapp: '99112233',
        phoneE164: '+96899112233',
        passwordHash: 'hash-must-strip',
      };

      const next: CallHandler = { handle: () => of(userProfile) };

      exposeInterceptor.intercept(contextWithHandler, next).subscribe((result: any) => {
        expect(result.id).toBe('u-me');
        expect(result.displayName).toBe('Said');
        expect(result.phone).toBe('+96899112233'); // ExposePhone allows user.phone
        expect(result.contactPhone).toBeUndefined(); // Legacy contactPhone ALWAYS stripped
        expect(result.whatsapp).toBeUndefined(); // Legacy whatsapp ALWAYS stripped
        expect(result.phoneE164).toBeUndefined(); // Legacy phoneE164 ALWAYS stripped
        expect(result.passwordHash).toBeUndefined(); // passwordHash ALWAYS stripped
        done();
      });
    });

    it('should strip phone when @ExposePhone() returns false', (done) => {
      const mockReflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      } as unknown as Reflector;

      const sanitizeInterceptor = new SanitizeInterceptor(mockReflector);

      const fakeHandler = () => {};
      const fakeClass = class {};
      const contextWithHandler = {
        getHandler: () => fakeHandler,
        getClass: () => fakeClass,
      } as unknown as ExecutionContext;

      const publicListing = {
        id: 'pub-1',
        title: 'Excavator CAT 320',
        phone: '+96891112222',
        contactPhone: '91112222',
      };

      const next: CallHandler = { handle: () => of(publicListing) };

      sanitizeInterceptor.intercept(contextWithHandler, next).subscribe((result: any) => {
        expect(result.title).toBe('Excavator CAT 320');
        expect(result.phone).toBeUndefined();
        expect(result.contactPhone).toBeUndefined();
        done();
      });
    });
  });

  describe('Redis cached responses (Proof of send-time sanitization without manual cache flush)', () => {
    it('should clean pre-cached response containing phone and contactPhone at transmission time', (done) => {
      // Simulate payload retrieved from Redis cache that was stored before phone stripping was applied
      const staleCachedPayloadFromRedis = {
        cachedAt: 1697300000,
        items: [
          {
            id: 'car-srv-1',
            title: 'Auto Care Muscat',
            contactPhone: '99887766',
            whatsapp: '99887766',
            phone: '99887766',
            whatsappEnabled: true,
            user: {
              id: 'owner-1',
              displayName: 'Workshop Owner',
              phone: '99887766',
            },
          },
        ],
      };

      const next: CallHandler = { handle: () => of(staleCachedPayloadFromRedis) };

      interceptor.intercept(mockContext, next).subscribe((result: any) => {
        const item = result.items[0];
        expect(item.id).toBe('car-srv-1');
        expect(item.title).toBe('Auto Care Muscat');
        expect(item.whatsappEnabled).toBe(true);

        // All contact numbers stripped at response time
        expect(item.contactPhone).toBeUndefined();
        expect(item.whatsapp).toBeUndefined();
        expect(item.phone).toBeUndefined();
        expect(item.user.phone).toBeUndefined();
        done();
      });
    });
  });

  describe('Edge cases (Primitive, null, undefined, empty, non-contact phone naming)', () => {
    it('should handle null and undefined seamlessly', (done) => {
      const nextNull: CallHandler = { handle: () => of(null) };
      interceptor.intercept(mockContext, nextNull).subscribe((res) => {
        expect(res).toBeNull();
        done();
      });
    });

    it('should handle primitives (string, number, boolean) without error', (done) => {
      const nextNum: CallHandler = { handle: () => of(42) };
      interceptor.intercept(mockContext, nextNum).subscribe((res) => {
        expect(res).toBe(42);
        done();
      });
    });

    it('should handle empty objects and arrays', (done) => {
      const nextEmpty: CallHandler = { handle: () => of({ empty: {}, arr: [] }) };
      interceptor.intercept(mockContext, nextEmpty).subscribe((res) => {
        expect(res).toEqual({ empty: {}, arr: [] });
        done();
      });
    });
  });
});

