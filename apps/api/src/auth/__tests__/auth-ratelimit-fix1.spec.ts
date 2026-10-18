import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AuthTokenService } from '../auth-token.service';
import {
  AuthAuditService,
  hashEmailForRedis,
  FORGOT_PASSWORD_COOLDOWN_SECONDS,
  FORGOT_PASSWORD_DAILY_CAP,
  FORGOT_PASSWORD_GLOBAL_DAILY_CAP,
  RESEND_VERIFICATION_COOLDOWN_SECONDS,
  RESEND_VERIFICATION_DAILY_CAP,
  SIGNUP_DAILY_IP_CAP,
} from '../auth-audit.service';
import { OtpService } from '../otp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { RedisService } from '../../redis/redis.service';
import { AccessTokenGate } from '../access-token-gate.service';
import { AccountStatusService } from '../account-status.service';
import { BanBlacklistService } from '../../ban-blacklist/ban-blacklist.service';
import { OtpPurpose } from '@prisma/client';

describe('Rate Limit Fix Part 1: AuthAuditService & AuthService', () => {
  let moduleRef: TestingModule;
  let authService: AuthService;
  let auditService: AuthAuditService;

  // In-memory Redis store tracking values and TTLs
  const redisStore = new Map<string, { value: any; ttlSeconds: number }>();

  const fakeRedis = {
    get: jest.fn().mockImplementation(async (key: string) => {
      const entry = redisStore.get(key);
      return entry !== undefined ? entry.value : null;
    }),
    set: jest.fn().mockImplementation(async (key: string, value: any, ttl?: number) => {
      redisStore.set(key, { value, ttlSeconds: ttl ?? -1 });
    }),
    trySetNX: jest.fn().mockImplementation(async (key: string, value: string, ttlSeconds: number) => {
      if (redisStore.has(key)) {
        return 'exists';
      }
      redisStore.set(key, { value, ttlSeconds });
      return 'acquired';
    }),
    setNX: jest.fn().mockImplementation(async (key: string, value: string, ttlSeconds: number) => {
      if (redisStore.has(key)) {
        return false;
      }
      redisStore.set(key, { value, ttlSeconds });
      return true;
    }),
    del: jest.fn().mockImplementation(async (key: string) => {
      redisStore.delete(key);
    }),
    incr: jest.fn().mockImplementation(async (key: string, ttlSeconds?: number) => {
      const entry = redisStore.get(key);
      const current = entry ? Number(entry.value) : 0;
      const next = current + 1;
      const ttl = entry ? entry.ttlSeconds : (ttlSeconds ?? -1);
      redisStore.set(key, { value: next, ttlSeconds: ttl });
      return next;
    }),
    expire: jest.fn().mockImplementation(async (key: string, seconds: number) => {
      const entry = redisStore.get(key);
      if (entry) {
        entry.ttlSeconds = seconds;
      }
    }),
    getTTL: jest.fn().mockImplementation(async (key: string) => {
      const entry = redisStore.get(key);
      return entry ? entry.ttlSeconds : -2;
    }),
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    loginAudit: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  const mockMail = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockOtp = {
    issue: jest.fn().mockResolvedValue('123456'),
  };

  const mockTokens = {
    signAccessToken: jest.fn().mockResolvedValue('test-access-token'),
    signVerificationToken: jest.fn().mockResolvedValue('test-verify-token'),
    generateRefreshToken: jest.fn().mockResolvedValue('test-refresh-token'),
    sanitizeUser: jest.fn().mockImplementation((u) => u),
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        AuthAuditService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: fakeRedis },
        { provide: MailService, useValue: mockMail },
        { provide: OtpService, useValue: mockOtp },
        { provide: AuthTokenService, useValue: mockTokens },
        { provide: AccessTokenGate, useValue: { validate: jest.fn() } },
        { provide: AccountStatusService, useValue: { assertCanAuthenticate: jest.fn() } },
        { provide: BanBlacklistService, useValue: { isPhoneBannedOrBlacklisted: jest.fn() } },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    auditService = moduleRef.get<AuthAuditService>(AuthAuditService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    redisStore.clear();
  });

  describe('Spec 1: forgot-password rate limits (V3)', () => {
    const rawEmail = 'User.Test+tag@Example.COM ';
    const expectedHash = hashEmailForRedis(rawEmail);
    const ipA = '192.0.2.1';
    const ipB = '198.51.100.2';

    it('hashes email with SHA-256 for Redis keys and never uses plaintext email in keys', async () => {
      expect(expectedHash).toMatch(/^[a-f0-9]{64}$/);
      expect(expectedHash).not.toContain('example.com');
      expect(expectedHash).not.toContain('User.Test');

      await auditService.checkAndRecordForgotPasswordLimit(rawEmail, ipA);

      const keys = Array.from(redisStore.keys());
      for (const k of keys) {
        expect(k).not.toContain('example.com');
        expect(k).toContain(expectedHash);
      }
    });

    it('enforces 2-minute cooldown between requests using atomic trySetNX per (email, ip)', async () => {
      // First attempt succeeds and sets cooldown key for ipA
      const first = await auditService.checkAndRecordForgotPasswordLimit(rawEmail, ipA);
      expect(first).toBe(true);
      expect(fakeRedis.trySetNX).toHaveBeenCalledWith(
        `auth:forgot:cooldown:${expectedHash}:${ipA}`,
        '1',
        FORGOT_PASSWORD_COOLDOWN_SECONDS,
      );

      // Immediate second attempt from same IP fails due to active cooldown (returns exists)
      const second = await auditService.checkAndRecordForgotPasswordLimit(rawEmail, ipA);
      expect(second).toBe(false);
    });

    it('cooldown applies to the same (email, IP) pair only; different IP is not blocked by cooldown', async () => {
      // Request from IP A acquires cooldown for IP A
      const first = await auditService.checkAndRecordForgotPasswordLimit(rawEmail, ipA);
      expect(first).toBe(true);

      // Request from IP B for the same email is NOT blocked by IP A's cooldown
      const requestFromIpB = await auditService.checkAndRecordForgotPasswordLimit(rawEmail, ipB);
      expect(requestFromIpB).toBe(true);
    });

    it('enforces daily cap of 5 requests max per requester (email, ip)', async () => {
      // Simulate 5 successful requests from IP A spaced beyond cooldown
      for (let i = 1; i <= FORGOT_PASSWORD_DAILY_CAP; i++) {
        // Clear cooldown to simulate passing 2 minutes
        redisStore.delete(`auth:forgot:cooldown:${expectedHash}:${ipA}`);
        const allowed = await auditService.checkAndRecordForgotPasswordLimit(rawEmail, ipA);
        expect(allowed).toBe(true);
      }

      // 6th attempt from IP A after cooldown should fail because requester daily count > 5
      redisStore.delete(`auth:forgot:cooldown:${expectedHash}:${ipA}`);
      const sixth = await auditService.checkAndRecordForgotPasswordLimit(rawEmail, ipA);
      expect(sixth).toBe(false);
    });

    it('attacker exhausting their daily cap from IP A does NOT prevent victim from IP B from receiving reset email', async () => {
      // Attacker on IP A makes 5 requests exhausting daily cap
      for (let i = 1; i <= FORGOT_PASSWORD_DAILY_CAP; i++) {
        redisStore.delete(`auth:forgot:cooldown:${expectedHash}:${ipA}`);
        const allowed = await auditService.checkAndRecordForgotPasswordLimit(rawEmail, ipA);
        expect(allowed).toBe(true);
      }

      // 6th attempt from Attacker IP A is blocked
      redisStore.delete(`auth:forgot:cooldown:${expectedHash}:${ipA}`);
      const blockedAttacker = await auditService.checkAndRecordForgotPasswordLimit(rawEmail, ipA);
      expect(blockedAttacker).toBe(false);

      // Victim on IP B requests forgotPassword
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'victim-user-1',
        email: 'user.test+tag@example.com',
      });

      const victimRes = await authService.forgotPassword(rawEmail, ipB);

      expect(victimRes).toEqual({ message: 'إذا كان البريد مسجلاً ستصلك رسالة' });
      expect(mockPrisma.user.findUnique).toHaveBeenCalled();
      expect(mockOtp.issue).toHaveBeenCalledWith('victim-user-1', OtpPurpose.PASSWORD_RESET, expect.any(Number));
      expect(mockMail.sendPasswordResetEmail).toHaveBeenCalledWith('user.test+tag@example.com', '123456');
    });

    it('21st request on the same email from different IPs is throttled by the global cap (20)', async () => {
      // 20 requests from 20 different IPs all succeed
      for (let i = 1; i <= FORGOT_PASSWORD_GLOBAL_DAILY_CAP; i++) {
        const ip = `10.0.0.${i}`;
        const allowed = await auditService.checkAndRecordForgotPasswordLimit(rawEmail, ip);
        expect(allowed).toBe(true);
      }

      // 21st request from a 21st distinct IP is throttled by global cap
      const ip21 = '10.0.0.21';
      const twentyFirst = await auditService.checkAndRecordForgotPasswordLimit(rawEmail, ip21);
      expect(twentyFirst).toBe(false);

      // Verify global counter in Redis reached 21
      expect(redisStore.get(`auth:forgot:global:${expectedHash}`)?.value).toBe(21);
    });

    it('falls back to "unknown" IP when ip is omitted and preserves backward compatibility', async () => {
      const allowed = await auditService.checkAndRecordForgotPasswordLimit(rawEmail);
      expect(allowed).toBe(true);
      expect(redisStore.has(`auth:forgot:cooldown:${expectedHash}:unknown`)).toBe(true);
      expect(redisStore.has(`auth:forgot:daily:${expectedHash}:unknown`)).toBe(true);
    });

    it('forgotPassword checks rate limit before querying database and returns generic message silently', async () => {
      // Simulate rate limit exceeded for ipA
      redisStore.set(`auth:forgot:cooldown:${expectedHash}:${ipA}`, { value: '1', ttlSeconds: 100 });

      const res = await authService.forgotPassword(rawEmail, ipA);

      expect(res).toEqual({ message: 'إذا كان البريد مسجلاً ستصلك رسالة' });
      // Database should NOT be queried when rate-limited!
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockMail.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(mockOtp.issue).not.toHaveBeenCalled();
    });

    it('forgotPassword sends email when within limits and user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-fp-1',
        email: 'user.test+tag@example.com',
      });

      const res = await authService.forgotPassword(rawEmail, ipA);

      expect(res).toEqual({ message: 'إذا كان البريد مسجلاً ستصلك رسالة' });
      expect(mockPrisma.user.findUnique).toHaveBeenCalled();
      expect(mockOtp.issue).toHaveBeenCalledWith('user-fp-1', OtpPurpose.PASSWORD_RESET, expect.any(Number));
      expect(mockMail.sendPasswordResetEmail).toHaveBeenCalledWith('user.test+tag@example.com', '123456');
    });

    it('forgotPassword returns generic message and does not throw when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await authService.forgotPassword(rawEmail, ipA);

      expect(res).toEqual({ message: 'إذا كان البريد مسجلاً ستصلك رسالة' });
      expect(mockMail.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('fails open on Redis error during forgotPassword check without throwing 500', async () => {
      fakeRedis.trySetNX.mockResolvedValueOnce('unavailable');
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-fp-2',
        email: 'user.test+tag@example.com',
      });

      const res = await authService.forgotPassword(rawEmail, ipA);

      expect(res).toEqual({ message: 'إذا كان البريد مسجلاً ستصلك رسالة' });
      expect(mockMail.sendPasswordResetEmail).toHaveBeenCalled();
    });
  });

  describe('Spec 2: resend-verification rate limits', () => {
    const userId = 'user-verify-123';

    it('throws 429 RESEND_COOLDOWN on immediate repeat within 60 seconds', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        isVerified: false,
      });

      // First resend succeeds
      const first = await authService.resendVerification(userId);
      expect(first).toEqual({ message: 'تم إرسال رمز تحقق جديد', emailSent: true });

      // Immediate second resend throws RESEND_COOLDOWN
      await expect(authService.resendVerification(userId)).rejects.toThrow(HttpException);

      try {
        await authService.resendVerification(userId);
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        const res = err.getResponse();
        expect(res.code).toBe('RESEND_COOLDOWN');
        expect(res.message).toBe('يرجى الانتظار دقيقة واحدة قبل طلب رمز جديد.');
      }
    });

    it('throws 429 RESEND_DAILY_LIMIT_EXCEEDED when daily cap of 10 is exceeded', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        isVerified: false,
      });

      // Simulate 10 requests by clearing cooldown between each
      for (let i = 1; i <= RESEND_VERIFICATION_DAILY_CAP; i++) {
        redisStore.delete(`auth:resend:cooldown:${userId}`);
        await authService.resendVerification(userId);
      }

      // 11th request after cooldown throws RESEND_DAILY_LIMIT_EXCEEDED
      redisStore.delete(`auth:resend:cooldown:${userId}`);

      try {
        await authService.resendVerification(userId);
        fail('Expected HttpException 429');
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        const res = err.getResponse();
        expect(res.code).toBe('RESEND_DAILY_LIMIT_EXCEEDED');
        expect(res.message).toBe('لقد بلغت الحد اليومي لطلب رمز التحقق. يرجى المحاولة غداً.');
      }
    });

    it('fails open when trySetNX returns unavailable during resend-verification check', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        isVerified: false,
      });

      fakeRedis.trySetNX.mockResolvedValueOnce('unavailable');

      const res = await authService.resendVerification(userId);
      expect(res).toEqual({ message: 'تم إرسال رمز تحقق جديد', emailSent: true });
    });
  });

  describe('Spec 3: signup IP rate limit (20 accounts / 24h)', () => {
    const ip = '198.51.100.42';

    const validSignupDto = {
      email: 'newuser@example.com',
      username: 'newuser123',
      password: 'Password123!',
      displayName: 'New User',
      country: 'OM',
      governorate: 'Muscat',
      city: 'Seeb',
    };

    it('allows signup when IP counter is below 20 and increments IP counter on success', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: 'newuser@example.com',
      });

      const res = await authService.signup(validSignupDto, ip);

      expect(res.requiresVerification).toBe(true);
      expect(fakeRedis.incr).toHaveBeenCalledWith(`auth:signup:ip:${ip}`, 24 * 60 * 60);
      expect(redisStore.get(`auth:signup:ip:${ip}`)?.value).toBe(1);
    });

    it('does NOT increment IP counter when signup fails validation or username duplicate', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing-id' }); // Duplicate username

      await expect(authService.signup(validSignupDto, ip)).rejects.toThrow(BadRequestException);

      // IP counter must NOT have incremented!
      expect(redisStore.get(`auth:signup:ip:${ip}`)).toBeUndefined();
    });

    it('throws 429 SIGNUP_IP_LIMIT_EXCEEDED on the 21st attempt from the same IP', async () => {
      // Simulate IP at 20 accounts
      redisStore.set(`auth:signup:ip:${ip}`, { value: SIGNUP_DAILY_IP_CAP, ttlSeconds: 3600 });

      try {
        await authService.signup(validSignupDto, ip);
        fail('Expected HttpException 429');
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        const res = err.getResponse();
        expect(res.code).toBe('SIGNUP_IP_LIMIT_EXCEEDED');
        expect(res.message).toBe('تم بلوغ الحد الأقصى لإنشاء الحسابات اليوم من هذه الشبكة. يرجى المحاولة لاحقاً.');
      }

      // No database queries should be performed when blocked by IP limit!
      expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('allows signup when ip is undefined (e.g. backward-compatibility in tests)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'no-ip-user',
        email: 'newuser@example.com',
      });

      const res = await authService.signup(validSignupDto);
      expect(res.requiresVerification).toBe(true);
    });

    it('fails open on Redis error during signup IP check', async () => {
      fakeRedis.get.mockRejectedValueOnce(new Error('Redis connection down'));
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'fail-open-user',
        email: 'newuser@example.com',
      });

      const res = await authService.signup(validSignupDto, ip);
      expect(res.requiresVerification).toBe(true);
    });
  });

  describe('Spec 4: Real RedisService in Disconnected State (Fail-Open Verification)', () => {
    let disconnectedRedisService: RedisService;
    let disconnectedAuditService: AuthAuditService;
    let disconnectedAuthService: AuthService;

    beforeAll(() => {
      // Instantiate the real RedisService class without calling onModuleInit() -> connected is false
      disconnectedRedisService = new RedisService();
      expect(disconnectedRedisService.isReady()).toBe(false);

      disconnectedAuditService = new AuthAuditService(mockPrisma as any, disconnectedRedisService);
      disconnectedAuthService = new AuthService(
        mockPrisma as any,
        mockMail as any,
        mockTokens as any,
        disconnectedAuditService,
        mockOtp as any,
        { validate: jest.fn() } as any,
        { assertCanAuthenticate: jest.fn() } as any,
        { isPhoneBannedOrBlacklisted: jest.fn() } as any,
      );
    });

    it('trySetNX returns "unavailable" on real disconnected RedisService', async () => {
      const res = await disconnectedRedisService.trySetNX('test:key', '1', 60);
      expect(res).toBe('unavailable');
    });

    it('forgot-password sends email when RedisService is real but disconnected (fail-open)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-disconnected-1',
        email: 'disconnected@example.com',
      });

      const res = await disconnectedAuthService.forgotPassword('disconnected@example.com');

      expect(res).toEqual({ message: 'إذا كان البريد مسجلاً ستصلك رسالة' });
      expect(mockPrisma.user.findUnique).toHaveBeenCalled();
      expect(mockOtp.issue).toHaveBeenCalledWith('u-disconnected-1', OtpPurpose.PASSWORD_RESET, expect.any(Number));
      expect(mockMail.sendPasswordResetEmail).toHaveBeenCalledWith('disconnected@example.com', '123456');
    });

    it('resend-verification succeeds without throwing 429 when RedisService is real but disconnected (fail-open)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-disconnected-2',
        email: 'resend-disconnected@example.com',
        isVerified: false,
      });

      const res = await disconnectedAuthService.resendVerification('u-disconnected-2');

      expect(res).toEqual({ message: 'تم إرسال رمز تحقق جديد', emailSent: true });
      expect(mockMail.sendVerificationEmail).toHaveBeenCalledWith('resend-disconnected@example.com', '123456');
    });

    it('signup succeeds and creates account when RedisService is real but disconnected (fail-open)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'u-disconnected-3',
        email: 'signup-disconnected@example.com',
      });

      const res = await disconnectedAuthService.signup(
        {
          email: 'signup-disconnected@example.com',
          username: 'discuser',
          password: 'Password123!',
          displayName: 'Disconnected User',
          country: 'OM',
          governorate: 'Muscat',
          city: 'Seeb',
        },
        '203.0.113.99',
      );

      expect(res.requiresVerification).toBe(true);
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });
  });
});
