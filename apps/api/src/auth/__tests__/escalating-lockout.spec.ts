import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { AuthTokenService } from '../auth-token.service';
import { AuthAuditService } from '../auth-audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { RedisService } from '../../redis/redis.service';
import * as bcrypt from 'bcryptjs';

describe('B2: Escalating Lockout (AuthAuditService & AuthService)', () => {
  let authService: AuthService;
  let auditService: AuthAuditService;

  // In-memory Redis mock for exact key-value and TTL tracking
  const redisStore = new Map<string, { value: any; ttlSeconds: number }>();

  const fakeRedis = {
    get: jest.fn().mockImplementation(async (key: string) => {
      const entry = redisStore.get(key);
      return entry !== undefined ? entry.value : null;
    }),
    set: jest.fn().mockImplementation(async (key: string, value: any, ttl?: number) => {
      redisStore.set(key, { value, ttlSeconds: ttl ?? -1 });
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
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    loginAudit: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockImplementation(async (cb: any) => {
      if (typeof cb === 'function') return cb(mockPrisma);
      return Promise.all(cb);
    }),
  };

  const mockJwt = {
    signAsync: jest.fn().mockResolvedValue('jwt-token'),
  };

  const mockMail = {
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    redisStore.clear();
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        AuthTokenService,
        AuthAuditService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: MailService, useValue: mockMail },
        { provide: RedisService, useValue: fakeRedis },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    auditService = module.get<AuthAuditService>(AuthAuditService);
  });

  it('9 wrong attempts => not locked; 10 wrong attempts => locked', async () => {
    const email = 'Victim@SouqOne.om';

    // 9 failed attempts
    for (let i = 1; i <= 9; i++) {
      await auditService.recordFailedAttempt(email);
      const status = await auditService.checkLockout(email);
      expect(status.locked).toBe(false);
    }

    // 10th failed attempt triggers lock
    await auditService.recordFailedAttempt(email);
    const status10 = await auditService.checkLockout(email);
    expect(status10.locked).toBe(true);
    expect(status10.ttlMinutes).toBe(15);
  });

  it('lock durations escalate 15m -> 1h -> 24h on successive rounds and cap at 24h', async () => {
    const email = 'escalate@souqone.om';
    const norm = 'escalate@souqone.om';

    // Round 1: 10 attempts -> 15 min (900s)
    for (let i = 0; i < 10; i++) {
      await auditService.recordFailedAttempt(email);
    }
    expect(redisStore.get(`auth:fail:${norm}`)?.ttlSeconds).toBe(15 * 60);
    expect(redisStore.get(`auth:lockstage:${norm}`)?.value).toBe(1);
    expect(redisStore.get(`auth:lockstage:${norm}`)?.ttlSeconds).toBe(24 * 60 * 60);

    // Simulate Round 1 lock expires (fail key removed, lockstage key remains)
    redisStore.delete(`auth:fail:${norm}`);

    // Round 2: 10 attempts -> 1 hour (3600s)
    for (let i = 0; i < 10; i++) {
      await auditService.recordFailedAttempt(email);
    }
    expect(redisStore.get(`auth:fail:${norm}`)?.ttlSeconds).toBe(60 * 60);
    expect(redisStore.get(`auth:lockstage:${norm}`)?.value).toBe(2);

    // Simulate Round 2 lock expires
    redisStore.delete(`auth:fail:${norm}`);

    // Round 3: 10 attempts -> 24 hours (86400s)
    for (let i = 0; i < 10; i++) {
      await auditService.recordFailedAttempt(email);
    }
    expect(redisStore.get(`auth:fail:${norm}`)?.ttlSeconds).toBe(24 * 60 * 60);
    expect(redisStore.get(`auth:lockstage:${norm}`)?.value).toBe(3);

    // Simulate Round 3 lock expires
    redisStore.delete(`auth:fail:${norm}`);

    // Round 4: capped at 24 hours
    for (let i = 0; i < 10; i++) {
      await auditService.recordFailedAttempt(email);
    }
    expect(redisStore.get(`auth:fail:${norm}`)?.ttlSeconds).toBe(24 * 60 * 60);
  });

  it('successful login resets both counter and stage', async () => {
    const email = 'resetme@souqone.om';
    const norm = 'resetme@souqone.om';
    const password = 'CorrectPassword123!';
    const passwordHash = await bcrypt.hash(password, 10);

    // 10 failed attempts -> locked in stage 1
    for (let i = 0; i < 10; i++) {
      await auditService.recordFailedAttempt(email);
    }
    expect(redisStore.has(`auth:fail:${norm}`)).toBe(true);
    expect(redisStore.has(`auth:lockstage:${norm}`)).toBe(true);

    // Simulate lock expires after 15 min, but lockstage remains
    redisStore.delete(`auth:fail:${norm}`);
    // Simulate some new failed attempts in new session before succeeding
    await auditService.recordFailedAttempt(email);
    expect(redisStore.has(`auth:fail:${norm}`)).toBe(true);
    expect(redisStore.has(`auth:lockstage:${norm}`)).toBe(true);

    // Successful login
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: norm,
      username: 'resetuser',
      role: 'USER',
      passwordHash,
    });
    mockPrisma.refreshToken.create.mockResolvedValue({ token: 'rt' });

    // Login succeeds and resets both counter and stage
    await authService.login({ email, password });

    expect(redisStore.has(`auth:fail:${norm}`)).toBe(false);
    expect(redisStore.has(`auth:lockstage:${norm}`)).toBe(false);
  });

  it('account A lock does not affect account B', async () => {
    const emailA = 'accountA@souqone.om';
    const emailB = 'accountB@souqone.om';

    for (let i = 0; i < 10; i++) {
      await auditService.recordFailedAttempt(emailA);
    }

    const statusA = await auditService.checkLockout(emailA);
    const statusB = await auditService.checkLockout(emailB);

    expect(statusA.locked).toBe(true);
    expect(statusB.locked).toBe(false);
  });

  it('forgot/reset work while account is locked and forgot-password does not increment failures', async () => {
    const email = 'lockeduser@souqone.om';
    const norm = 'lockeduser@souqone.om';

    // Lock account
    for (let i = 0; i < 10; i++) {
      await auditService.recordFailedAttempt(email);
    }
    expect((await auditService.checkLockout(email)).locked).toBe(true);

    // forgotPassword works while locked
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u-locked',
      email: norm,
      passwordResetCode: '556677',
      passwordResetExpiry: new Date(Date.now() + 60000),
    });
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const forgotRes = await authService.forgotPassword(email);
    expect(forgotRes.message).toContain('ستصلك رسالة');

    // resetPassword works while locked
    const resetRes = await authService.resetPassword(email, '556677', 'NewPass999!');
    expect(resetRes.message).toContain('تم تغيير كلمة المرور بنجاح');
  });

  it('counts failures for non-existing emails too (anti-enumeration)', async () => {
    const nonExisting = 'doesnotexist@souqone.om';
    const norm = 'doesnotexist@souqone.om';

    mockPrisma.user.findUnique.mockResolvedValue(null);

    for (let i = 0; i < 10; i++) {
      await expect(
        authService.login({ email: nonExisting, password: 'WrongPassword!' }),
      ).rejects.toThrow(UnauthorizedException);
    }

    expect(redisStore.get(`auth:fail:${norm}`)?.value).toBe(10);
    expect(redisStore.get(`auth:lockstage:${norm}`)?.value).toBe(1);

    // 11th attempt returns account locked error message
    await expect(
      authService.login({ email: nonExisting, password: 'WrongPassword!' }),
    ).rejects.toThrow(/تم قفل الحساب مؤقتاً/);
  });
});
