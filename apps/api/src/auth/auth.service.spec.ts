import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { AuthAuditService } from './auth-audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../redis/redis.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  loginAudit: {
    create: jest.fn().mockResolvedValue({}),
  },
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

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        AuthTokenService,
        AuthAuditService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: MailService, useValue: mockMail },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  /* ═══════ SIGNUP ═══════ */
  describe('signup', () => {
    it('should create a new user and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        passwordHash: 'hashed',
      });
      mockPrisma.refreshToken.create.mockResolvedValue({ token: 'hashed-token' });

      const result = await service.signup({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password1',
      });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.requiresVerification).toBe(true);
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

    it('should store hashed refresh token in DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1', email: 'a@b.com', username: 'u', role: 'USER', passwordHash: 'h',
      });
      mockPrisma.refreshToken.create.mockResolvedValue({ token: 'whatever' });

      const result = await service.signup({
        email: 'a@b.com', username: 'u', password: 'Password1',
      });

      // The token stored in DB should be a SHA-256 hash, not the raw token
      const storedToken = mockPrisma.refreshToken.create.mock.calls[0][0].data.token;
      expect(storedToken).toHaveLength(64); // SHA-256 hex = 64 chars
      expect(storedToken).not.toBe(result.refreshToken); // raw != hash
    });
  });

  /* ═══════ LOGIN ═══════ */
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Password1', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'test@example.com', username: 'testuser', role: 'USER', passwordHash: hash,
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
        id: 'user-1', email: 'test@example.com', username: 'u', role: 'USER', passwordHash: hash,
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

    it('should block login after 5 failed attempts', async () => {
      mockRedis.get.mockResolvedValue(5);
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
        id: 'user-1', email: 'a@b.com', username: 'u', role: 'USER',
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
    it('should verify email with correct code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', isVerified: false,
        emailVerificationCode: '123456',
        emailVerificationExpiry: new Date(Date.now() + 60000),
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.verifyEmail('user-1', '123456');
      expect(result.message).toContain('توثيق');
    });

    it('should throw for wrong code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', isVerified: false,
        emailVerificationCode: '123456',
        emailVerificationExpiry: new Date(Date.now() + 60000),
      });

      await expect(service.verifyEmail('user-1', '000000')).rejects.toThrow(BadRequestException);
    });

    it('should throw for expired code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', isVerified: false,
        emailVerificationCode: '123456',
        emailVerificationExpiry: new Date(Date.now() - 1000),
      });

      await expect(service.verifyEmail('user-1', '123456')).rejects.toThrow(BadRequestException);
    });

    it('should return success if already verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1', isVerified: true,
      });

      const result = await service.verifyEmail('user-1', '123456');
      expect(result.message).toContain('موثق');
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
  });

  /* ═══════ RESET PASSWORD ═══════ */
  describe('resetPassword', () => {
    it('should reset password with valid code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.com',
        passwordResetCode: '654321',
        passwordResetExpiry: new Date(Date.now() + 60000),
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.resetPassword('a@b.com', '654321', 'NewPass1');
      expect(result.message).toContain('تغيير');
    });

    it('should throw for expired reset code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.com',
        passwordResetCode: '654321',
        passwordResetExpiry: new Date(Date.now() - 1000),
      });

      await expect(
        service.resetPassword('a@b.com', '654321', 'NewPass1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for wrong reset code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'a@b.com',
        passwordResetCode: '654321',
        passwordResetExpiry: new Date(Date.now() + 60000),
      });

      await expect(
        service.resetPassword('a@b.com', '000000', 'NewPass1'),
      ).rejects.toThrow(BadRequestException);
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
        id: 'user-1', email: 'test@example.com', username: 'u', role: 'USER', passwordHash: hash,
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
      mockRedis.get.mockResolvedValue(5);
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
});
