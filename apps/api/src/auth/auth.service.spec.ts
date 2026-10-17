import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { AuthAuditService } from './auth-audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../redis/redis.service';
import { OtpService } from './otp.service';
import { AccessTokenGate } from './access-token-gate.service';
import { AccountStatusService } from './account-status.service';
import { BanBlacklistService } from '../ban-blacklist/ban-blacklist.service';
import { OtpPurpose } from '@prisma/client';

const mockBanBlacklistService = {
  isPhoneBlocked: jest.fn().mockResolvedValue(false),
  isGoogleBlocked: jest.fn().mockResolvedValue(false),
  hashPhone: jest.fn().mockReturnValue('mock-phone-hash'),
  hashGoogle: jest.fn().mockReturnValue('mock-google-hash'),
  addForUser: jest.fn().mockResolvedValue(1),
  removeForUser: jest.fn().mockResolvedValue(1),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  loginAudit: {
    create: jest.fn().mockResolvedValue({}),
  },
  $transaction: jest.fn().mockImplementation(async (cb: any) => {
    if (typeof cb === 'function') {
      return cb(mockPrisma);
    }
    return Promise.all(cb);
  }),
};

const mockJwt = {
  signAsync: jest.fn().mockResolvedValue('mock-access-token'),
};

const mockMail = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  incr: jest.fn().mockResolvedValue(1),
  getTTL: jest.fn().mockResolvedValue(900),
};

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const mockOtp = {
  issue: jest.fn().mockResolvedValue('123456'),
  verify: jest.fn().mockImplementation(async (userId: string, purpose: any, code: string) => {
    if (code === '123456' || code === '654321') return 'OK';
    if (code === 'expired') return 'MISSING_OR_EXPIRED';
    return 'INVALID';
  }),
  invalidateActive: jest.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
  let service: AuthService;
  let tokenService: AuthTokenService;
  let mockAccountStatusService: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockRedis.incr.mockResolvedValue(1);

    mockOtp.issue.mockResolvedValue('123456');
    mockOtp.verify.mockImplementation(async (userId: string, purpose: any, code: string) => {
      if (code === '123456' || code === '654321') return 'OK';
      if (code === 'expired') return 'MISSING_OR_EXPIRED';
      return 'INVALID';
    });

    mockAccountStatusService = {
      assertCanAuthenticate: jest.fn().mockImplementation(async (user: any) => {
        if (user.status === 'BANNED') {
          throw new ForbiddenException({
            statusCode: 403,
            code: 'ACCOUNT_BANNED',
            message: 'تم حظر حسابك لمخالفة شروط الاستخدام',
          });
        }
        if (user.status === 'SUSPENDED') {
          const now = new Date();
          const until = user.suspendedUntil ? new Date(user.suspendedUntil) : null;
          if (!until || until.getTime() > now.getTime()) {
            throw new ForbiddenException({
              statusCode: 403,
              code: 'ACCOUNT_SUSPENDED',
              message: 'تم إيقاف حسابك مؤقتاً',
              suspendedUntil: until ? until.toISOString() : null,
            });
          }
          user.status = 'ACTIVE';
          user.suspendedUntil = null;
          return;
        }
        if (user.status === 'DELETED') {
          throw new UnauthorizedException('بيانات الدخول غير صحيحة');
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        AuthTokenService,
        AuthAuditService,
        { provide: OtpService, useValue: mockOtp },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: MailService, useValue: mockMail },
        { provide: RedisService, useValue: mockRedis },
        { provide: AccessTokenGate, useValue: { invalidate: jest.fn().mockResolvedValue(undefined), validate: jest.fn().mockResolvedValue({ tv: 0, status: 'ACTIVE' }) } },
        { provide: AccountStatusService, useValue: mockAccountStatusService },
        { provide: BanBlacklistService, useValue: mockBanBlacklistService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    tokenService = module.get<AuthTokenService>(AuthTokenService);
  });

  /* ═══════ SIGNUP ═══════ */
  describe('signup', () => {
    it('should create a new user and return verification gate response without tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        passwordHash: 'hashed',
        isVerified: false,
      });

      const result = await service.signup({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password1',
      });

      expect(result.requiresVerification).toBe(true);
      expect(result.verificationToken).toBe('mock-access-token');
      expect(result.emailSent).toBe(true);
      expect(result.user).toEqual({ email: 'test@example.com' });
      expect((result as any).accessToken).toBeUndefined();
      expect((result as any).refreshToken).toBeUndefined();
      expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
      expect(mockMail.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
    });

    it('should throw if email already exists', async () => {
      mockPrisma.user.create.mockRejectedValue({ code: 'P2002', meta: { target: ['email'] } });

      await expect(
        service.signup({ email: 'test@example.com', username: 'new', password: 'Password1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should normalize and store Omani phone in E.164 format on signup', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-oman-1',
        email: 'oman@example.com',
        username: 'omanuser',
        role: 'USER',
        phone: '+96891234567',
      });

      await service.signup({
        email: 'oman@example.com',
        username: 'omanuser',
        password: 'Password1',
        phone: '91234567',
      });

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.phone).toBe('+96891234567');
    });

    it('should reject signup with 400 when phone is invalid or disallowed country', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.signup({
          email: 'disallowed@example.com',
          username: 'disalloweduser',
          password: 'Password1',
          phone: '+971501234567',
        }),
      ).rejects.toThrow(new BadRequestException('رقم الهاتف غير صالح أو غير مدعوم في دولتك'));

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should reject signup with Egyptian phone in production when default allowlist is 968', async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevCodes = process.env.PHONE_ALLOWED_COUNTRY_CODES;
      try {
        process.env.NODE_ENV = 'production';
        delete process.env.PHONE_ALLOWED_COUNTRY_CODES;

        mockPrisma.user.findFirst.mockResolvedValue(null);

        await expect(
          service.signup({
            email: 'egypt-prod@example.com',
            username: 'egyptproduser',
            password: 'Password1',
            phone: '01012345678',
          }),
        ).rejects.toThrow(new BadRequestException('رقم الهاتف غير صالح أو غير مدعوم في دولتك'));

        expect(mockPrisma.user.create).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevCodes !== undefined) {
          process.env.PHONE_ALLOWED_COUNTRY_CODES = prevCodes;
        } else {
          delete process.env.PHONE_ALLOWED_COUNTRY_CODES;
        }
      }
    });

    it('should accept Egyptian phone on signup in non-production environment', async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevCodes = process.env.PHONE_ALLOWED_COUNTRY_CODES;
      try {
        process.env.NODE_ENV = 'development';
        delete process.env.PHONE_ALLOWED_COUNTRY_CODES;

        mockPrisma.user.findFirst.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
          id: 'user-egypt-1',
          email: 'egypt-dev@example.com',
          username: 'egyptdevuser',
          role: 'USER',
          phone: '+201012345678',
        });

        await service.signup({
          email: 'egypt-dev@example.com',
          username: 'egyptdevuser',
          password: 'Password1',
          phone: '01012345678',
        });

        const createCall = mockPrisma.user.create.mock.calls[0][0];
        expect(createCall.data.phone).toBe('+201012345678');
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevCodes !== undefined) {
          process.env.PHONE_ALLOWED_COUNTRY_CODES = prevCodes;
        } else {
          delete process.env.PHONE_ALLOWED_COUNTRY_CODES;
        }
      }
    });
  });

  /* ═══════ LOGIN ═══════ */
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Password1', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'test@example.com', username: 'testuser', role: 'USER', passwordHash: hash, isVerified: true,
      });
      mockPrisma.refreshToken.create.mockResolvedValue({ token: 'hashed-token' });

      const result = await service.login({ email: 'test@example.com', password: 'Password1' });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw for invalid credentials (no user)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nope@example.com', password: 'Wrong1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw for wrong password', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Password1', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'test@example.com', username: 'u', role: 'USER', passwordHash: hash,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'WrongPass1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reset lockout counter on successful login', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Password1', 10);

      mockRedis.get.mockResolvedValue(2); // 2 previous attempts
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'test@example.com', username: 'u', role: 'USER', passwordHash: hash, isVerified: true,
      });
      mockPrisma.refreshToken.create.mockResolvedValue({ token: 'ht' });

      await service.login({ email: 'test@example.com', password: 'Password1' });

      expect(mockRedis.del).toHaveBeenCalledWith('auth:fail:test@example.com');
    });

    it('should increment failed attempts on wrong password', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Password1', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'test@example.com', username: 'u', role: 'USER', passwordHash: hash,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'WrongPass1' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockRedis.incr).toHaveBeenCalledWith('auth:fail:test@example.com', 900);
    });

    it('should block login after 10 failed attempts', async () => {
      mockRedis.get.mockResolvedValue(10);
      mockRedis.getTTL.mockResolvedValue(600);

      await expect(
        service.login({ email: 'locked@example.com', password: 'Any1' }),
      ).rejects.toThrow(UnauthorizedException);

      // Should NOT even attempt DB lookup
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw for Google-only account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'g@example.com', username: 'g', role: 'USER', passwordHash: null,
      });

      await expect(
        service.login({ email: 'g@example.com', password: 'Password1' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  /* ═══════ REFRESH ═══════ */
  describe('refresh', () => {
    it('should return new tokens for valid refresh token', async () => {
      const rawToken = 'raw-refresh-token-abc';
      const hashed = hashToken(rawToken);

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1', token: hashed, userId: 'user-1',
        expiresAt: new Date(Date.now() + 86400000), revokedAt: null,
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'a@b.com', username: 'u', role: 'USER', isVerified: true,
      });
      mockPrisma.refreshToken.create.mockResolvedValue({ token: 'new-hashed' });

      const result = await service.refresh(rawToken);

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeDefined();
      // Should lookup by hashed token
      expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: hashed },
      });
    });

    it('should reject expired refresh token', async () => {
      const rawToken = 'expired-token';
      const hashed = hashToken(rawToken);

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1', token: hashed, userId: 'user-1',
        expiresAt: new Date(Date.now() - 1000), revokedAt: null,
      });

      await expect(service.refresh(rawToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject revoked refresh token', async () => {
      const rawToken = 'revoked-token';
      const hashed = hashToken(rawToken);

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1', token: hashed, userId: 'user-1',
        expiresAt: new Date(Date.now() + 86400000), revokedAt: new Date(),
      });

      await expect(service.refresh(rawToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  /* ═══════ VERIFY EMAIL ═══════ */
  describe('verifyEmail', () => {
    it('should verify email with correct code and return session tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', isVerified: false,
        emailVerificationCode: '123456',
        emailVerificationExpiry: new Date(Date.now() + 60000),
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1', email: 'test@example.com', username: 'u', role: 'USER', isVerified: true,
      });
      mockPrisma.refreshToken.create.mockResolvedValue({ token: 'ht' });

      const result = await service.verifyEmail('user-1', '123456');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.isVerified).toBe(true);
    });

    it('should throw for wrong code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', isVerified: false,
      });

      await expect(service.verifyEmail('user-1', '000000')).rejects.toThrow(BadRequestException);
    });

    it('should throw for expired code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', isVerified: false,
      });
      mockOtp.verify.mockResolvedValueOnce('MISSING_OR_EXPIRED');

      await expect(service.verifyEmail('user-1', 'expired')).rejects.toThrow(BadRequestException);
    });

    it('should return message without session tokens if already verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', isVerified: true, role: 'USER',
      });

      const result = await service.verifyEmail('user-1', '123456');
      expect(result).toEqual({
        message: 'البريد موثق بالفعل. يرجى تسجيل الدخول.',
        alreadyVerified: true,
      });
      expect((result as any).accessToken).toBeUndefined();
      expect((result as any).refreshToken).toBeUndefined();
      expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
    });
  });

  /* ═══════ FORGOT PASSWORD ═══════ */
  describe('forgotPassword', () => {
    it('should return safe message even if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');
      expect(result.message).toContain('ستصلك رسالة');
    });

    it('should send reset email if user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
      mockPrisma.user.update.mockResolvedValue({});

      await service.forgotPassword('a@b.com');

      expect(mockMail.sendPasswordResetEmail).toHaveBeenCalledWith('a@b.com', expect.any(String));
    });

    it('should return safe message when email sending fails and preserve anti-enumeration', async () => {
      const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      try {
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
        mockPrisma.user.update.mockResolvedValue({});
        const mailError = new Error('SMTP outage');
        mockMail.sendPasswordResetEmail.mockRejectedValueOnce(mailError);

        const result = await service.forgotPassword('a@b.com');

        expect(result.message).toContain('ستصلك رسالة');
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith(
          'Failed to send password reset email for user u1',
          mailError.stack,
        );

        // Security check: ensure reset code is NEVER logged
        const loggedArgs = JSON.stringify(errorSpy.mock.calls);
        expect(mockOtp.issue).toHaveBeenCalledWith('u1', 'PASSWORD_RESET', expect.any(Number));
        expect(loggedArgs).not.toContain('123456');
      } finally {
        errorSpy.mockRestore();
      }
    });
  });

  /* ═══════ RESET PASSWORD ═══════ */
  describe('resetPassword', () => {
    it('should reset password with valid code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.com',
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.resetPassword('a@b.com', '654321', 'NewPass1');
      expect(result.message).toContain('تغيير');
    });

    it('should throw for expired reset code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.com',
      });
      mockOtp.verify.mockResolvedValueOnce('MISSING_OR_EXPIRED');

      await expect(
        service.resetPassword('a@b.com', 'expired', 'NewPass1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for wrong reset code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.com',
      });
      mockOtp.verify.mockResolvedValueOnce('INVALID');

      await expect(
        service.resetPassword('a@b.com', '000000', 'NewPass1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw identical exception and message for non-existent email and existing email without active challenge', async () => {
      // 1. Non-existent email
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      let nonExistentError: any;
      try {
        await service.resetPassword('nonexistent@example.com', '123456', 'NewPass123!');
      } catch (err) {
        nonExistentError = err;
      }

      // 2. Existing email without active challenge
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'u-existing',
        email: 'existing@example.com',
      });
      mockOtp.verify.mockResolvedValueOnce('MISSING_OR_EXPIRED');
      let noChallengeError: any;
      try {
        await service.resetPassword('existing@example.com', '123456', 'NewPass123!');
      } catch (err) {
        noChallengeError = err;
      }

      expect(nonExistentError).toBeInstanceOf(BadRequestException);
      expect(noChallengeError).toBeInstanceOf(BadRequestException);
      expect(nonExistentError.message).toBe('رمز إعادة التعيين منتهي. اطلب رمزاً جديداً.');
      expect(noChallengeError.message).toBe('رمز إعادة التعيين منتهي. اطلب رمزاً جديداً.');
      expect(nonExistentError.message).toBe(noChallengeError.message);
    });
  });

  /* ═══════ LOGOUT ═══════ */
  describe('logout', () => {
    it('should revoke refresh token', async () => {
      const rawToken = 'logout-token';
      const hashed = hashToken(rawToken);

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1', token: hashed, revokedAt: null,
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});

      const result = await service.logout(rawToken);
      expect(result.message).toContain('خروج');
      expect(mockPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: hashed },
      });
    });

    it('should handle already-revoked token gracefully', async () => {
      const rawToken = 'already-revoked';
      const hashed = hashToken(rawToken);

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1', token: hashed, revokedAt: new Date(),
      });

      const result = await service.logout(rawToken);
      expect(result.message).toContain('خروج');
      expect(mockPrisma.refreshToken.update).not.toHaveBeenCalled();
    });
  });

  /* ═══════ LOGIN AUDIT ═══════ */
  describe('loginAudit', () => {
    it('should log successful login', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Password1', 10);
      mockRedis.get.mockResolvedValue(null);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'test@example.com', username: 'u', role: 'USER', passwordHash: hash, isVerified: true,
      });
      mockPrisma.refreshToken.create.mockResolvedValue({ token: 'ht' });

      await service.login({ email: 'test@example.com', password: 'Password1' }, '127.0.0.1', 'TestAgent');

      expect(mockPrisma.loginAudit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          userId: 'user-1',
          success: true,
          method: 'EMAIL',
          ipAddress: '127.0.0.1',
          userAgent: 'TestAgent',
        }),
      });
    });

    it('should log failed login (wrong password)', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Password1', 10);
      mockRedis.get.mockResolvedValue(null);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'fail@example.com', username: 'u', role: 'USER', passwordHash: hash,
      });

      await expect(
        service.login({ email: 'fail@example.com', password: 'WrongPass1' }, '10.0.0.1', 'Bot'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrisma.loginAudit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'fail@example.com',
          success: false,
          reason: 'WRONG_PASSWORD',
        }),
      });
    });

    it('should log lockout attempt', async () => {
      mockRedis.get.mockResolvedValue(10);
      mockRedis.getTTL.mockResolvedValue(600);

      await expect(
        service.login({ email: 'locked@example.com', password: 'Any1' }, '10.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrisma.loginAudit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'locked@example.com',
          success: false,
          reason: 'ACCOUNT_LOCKED',
        }),
      });
    });
  });

  /* ═══════ SANITIZE USER ═══════ */
  describe('AuthTokenService.sanitizeUser', () => {
    it('should strip googleId and all sensitive fields from user', () => {
      const fullUser: any = {
        id: 'u-100',
        email: 'user@test.com',
        username: 'user100',
        displayName: 'User 100',
        role: 'USER',
        googleId: 'google-sub-secret-id',
        passwordHash: 'secret-hash',
        emailVerificationCode: '123456',
        emailVerificationExpiry: new Date(),
        passwordResetCode: '654321',
        passwordResetExpiry: new Date(),
      };

      const sanitized: any = tokenService.sanitizeUser(fullUser);

      expect(sanitized.googleId).toBeUndefined();
      expect(sanitized.passwordHash).toBeUndefined();
      expect(sanitized.emailVerificationCode).toBeUndefined();
      expect(sanitized.emailVerificationExpiry).toBeUndefined();
      expect(sanitized.passwordResetCode).toBeUndefined();
      expect(sanitized.passwordResetExpiry).toBeUndefined();
      expect(sanitized.id).toBe('u-100');
      expect(sanitized.email).toBe('user@test.com');
    });
  });

  /* ═══════ PART 6B PR2-A ACCOUNT STATUS ENFORCEMENT ═══════ */
  describe('Part 6b PR2-A Account Status Enforcement (login, googleAuth, verifyEmail)', () => {
    const bcrypt = require('bcryptjs');

    describe('login status enforcement', () => {
      it('rejects BANNED user on login with 403 ACCOUNT_BANNED and records loginAudit before error throws', async () => {
        const hash = await bcrypt.hash('CorrectPassword1!', 10);
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 'u-banned',
          email: 'banned@test.com',
          username: 'banned_user',
          role: 'USER',
          status: 'BANNED',
          passwordHash: hash,
          isVerified: true,
        });

        try {
          await service.login({ email: 'banned@test.com', password: 'CorrectPassword1!' }, '1.2.3.4', 'TestAgent');
          fail('Expected ForbiddenException');
        } catch (err: any) {
          expect(err).toBeInstanceOf(ForbiddenException);
          expect(err.getStatus()).toBe(403);
          expect(err.getResponse()).toEqual({
            statusCode: 403,
            code: 'ACCOUNT_BANNED',
            message: 'تم حظر حسابك لمخالفة شروط الاستخدام',
          });

          // Must write audit log with reason ACCOUNT_BANNED before throwing
          expect(mockPrisma.loginAudit.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
              email: 'banned@test.com',
              userId: 'u-banned',
              success: false,
              reason: 'ACCOUNT_BANNED',
              ipAddress: '1.2.3.4',
              userAgent: 'TestAgent',
            }),
          });
        }
      });

      it('rejects wrong password on BANNED account with generic 401 without leaking status', async () => {
        const hash = await bcrypt.hash('CorrectPassword1!', 10);
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 'u-banned',
          email: 'banned@test.com',
          username: 'banned_user',
          role: 'USER',
          status: 'BANNED',
          passwordHash: hash,
          isVerified: true,
        });

        try {
          await service.login({ email: 'banned@test.com', password: 'WrongPassword123' }, '1.2.3.4', 'TestAgent');
          fail('Expected UnauthorizedException');
        } catch (err: any) {
          expect(err).toBeInstanceOf(UnauthorizedException);
          expect(err.getStatus()).toBe(401);
          expect(err.message).toBe('بيانات الدخول غير صحيحة');
          expect(err.getResponse()).not.toHaveProperty('code');

          // Log reason must be WRONG_PASSWORD, not ACCOUNT_BANNED
          expect(mockPrisma.loginAudit.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
              email: 'banned@test.com',
              userId: 'u-banned',
              success: false,
              reason: 'WRONG_PASSWORD',
            }),
          });

          // assertCanAuthenticate must NOT be called when password was wrong
          expect(mockAccountStatusService.assertCanAuthenticate).not.toHaveBeenCalled();
        }
      });

      it('rejects active SUSPENDED user on login with 403 ACCOUNT_SUSPENDED and records audit', async () => {
        const hash = await bcrypt.hash('CorrectPassword1!', 10);
        const future = new Date(Date.now() + 86400000);
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 'u-suspended',
          email: 'suspended@test.com',
          username: 'suspended_user',
          role: 'USER',
          status: 'SUSPENDED',
          suspendedUntil: future,
          passwordHash: hash,
          isVerified: true,
        });

        try {
          await service.login({ email: 'suspended@test.com', password: 'CorrectPassword1!' }, '1.2.3.4', 'TestAgent');
          fail('Expected ForbiddenException');
        } catch (err: any) {
          expect(err).toBeInstanceOf(ForbiddenException);
          expect(err.getStatus()).toBe(403);
          expect(err.getResponse()).toEqual({
            statusCode: 403,
            code: 'ACCOUNT_SUSPENDED',
            message: 'تم إيقاف حسابك مؤقتاً',
            suspendedUntil: future.toISOString(),
          });

          expect(mockPrisma.loginAudit.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
              email: 'suspended@test.com',
              userId: 'u-suspended',
              success: false,
              reason: 'ACCOUNT_SUSPENDED',
            }),
          });
        }
      });

      it('allows expired SUSPENDED user to login after lazy un-suspension', async () => {
        const hash = await bcrypt.hash('CorrectPassword1!', 10);
        const past = new Date(Date.now() - 3600000);
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 'u-expired',
          email: 'expired@test.com',
          username: 'expired_user',
          role: 'USER',
          status: 'SUSPENDED',
          suspendedUntil: past,
          passwordHash: hash,
          isVerified: true,
        });
        mockPrisma.refreshToken.create.mockResolvedValue({ token: 'mock-rf' });

        const result = await service.login({ email: 'expired@test.com', password: 'CorrectPassword1!' });
        expect(result.accessToken).toBe('mock-access-token');
        expect(result.refreshToken).toBeDefined();
        expect(mockPrisma.loginAudit.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            email: 'expired@test.com',
            userId: 'u-expired',
            success: true,
          }),
        });
      });

      it('rejects DELETED user on login with generic 401 without leakage', async () => {
        const hash = await bcrypt.hash('CorrectPassword1!', 10);
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 'u-deleted',
          email: 'deleted@test.com',
          username: 'deleted_user',
          role: 'USER',
          status: 'DELETED',
          passwordHash: hash,
          isVerified: true,
        });

        await expect(
          service.login({ email: 'deleted@test.com', password: 'CorrectPassword1!' }),
        ).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('googleAuth status enforcement', () => {
      it('rejects BANNED user on googleAuth before issuing tokens', async () => {
        // Mock googleClient verifyIdToken
        (service as any).googleClient = {
          verifyIdToken: jest.fn().mockResolvedValue({
            getPayload: () => ({
              email: 'banned@gmail.com',
              email_verified: true,
              sub: 'google-sub-banned',
              name: 'Banned Person',
            }),
          }),
        };

        mockPrisma.user.findUnique.mockResolvedValue({
          id: 'u-google-banned',
          email: 'banned@gmail.com',
          googleId: 'google-sub-banned',
          status: 'BANNED',
          isVerified: true,
        });

        await expect(
          service.googleAuth({ idToken: 'valid-google-token' }),
        ).rejects.toThrow(ForbiddenException);

        expect(mockAccountStatusService.assertCanAuthenticate).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'u-google-banned', status: 'BANNED' }),
        );
      });
    });

    describe('verifyEmail status enforcement', () => {
      it('rejects BANNED user on verifyEmail and does NOT call user.update', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 'u-verify-banned',
          isVerified: false,
          status: 'BANNED',
        });

        await expect(
          service.verifyEmail('u-verify-banned', '123456'),
        ).rejects.toThrow(ForbiddenException);

        expect(mockAccountStatusService.assertCanAuthenticate).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'u-verify-banned', status: 'BANNED' }),
        );
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });

      it('rejects SUSPENDED user on verifyEmail and does NOT call user.update', async () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 'u-verify-suspended',
          isVerified: false,
          status: 'SUSPENDED',
          suspendedUntil: futureDate,
        });

        await expect(
          service.verifyEmail('u-verify-suspended', '123456'),
        ).rejects.toThrow(ForbiddenException);

        expect(mockAccountStatusService.assertCanAuthenticate).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'u-verify-suspended', status: 'SUSPENDED' }),
        );
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });
    });
  });
});

