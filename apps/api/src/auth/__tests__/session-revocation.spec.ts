import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { AuthTokenService } from '../auth-token.service';
import { AuthAuditService } from '../auth-audit.service';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { RedisService } from '../../redis/redis.service';
import { GeoService } from '../../locations/geo.service';
import * as bcrypt from 'bcryptjs';

describe('B1: Session Revocation on Password Change and Reset', () => {
  let authService: AuthService;
  let authTokenService: AuthTokenService;
  let usersService: UsersService;

  const mockPrisma: any = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
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
    signAsync: jest.fn().mockResolvedValue('new-jwt-access-token'),
  };

  const mockMail = {
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    incr: jest.fn().mockResolvedValue(1),
    getTTL: jest.fn().mockResolvedValue(900),
  };

  const mockGeo = {
    validateLocationPair: jest.fn(),
    syncLocation: jest.fn(),
    clearLocation: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        AuthTokenService,
        AuthAuditService,
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: MailService, useValue: mockMail },
        { provide: RedisService, useValue: mockRedis },
        { provide: GeoService, useValue: mockGeo },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authTokenService = module.get<AuthTokenService>(AuthTokenService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('AuthTokenService.revokeAllRefreshTokens', () => {
    it('should revoke all active tokens for userId and leave other users untouched', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      await authTokenService.revokeAllRefreshTokens('user-target');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-target', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('AuthService.resetPassword', () => {
    it('should update password and revoke all sessions in ONE transaction, keeping response unchanged', async () => {
      const resetUser = {
        id: 'u-reset-1',
        email: 'victim@souqone.om',
        passwordResetCode: '112233',
        passwordResetExpiry: new Date(Date.now() + 60000),
      };

      mockPrisma.user.findUnique.mockResolvedValue(resetUser);
      mockPrisma.user.update.mockResolvedValue({ id: 'u-reset-1' });
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      const res = await authService.resetPassword('victim@souqone.om', '112233', 'NewSecurePass123!');

      expect(res).toEqual({ message: 'تم تغيير كلمة المرور بنجاح' });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u-reset-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('old refresh token after reset => rejected during refresh', async () => {
      const oldHashedToken = authTokenService.hashToken('old-raw-token');
      // Simulate stored token after reset is revoked
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-old',
        token: oldHashedToken,
        userId: 'u-reset-1',
        revokedAt: new Date(), // revoked
        expiresAt: new Date(Date.now() + 86400000),
      });

      await expect(authService.refresh('old-raw-token')).rejects.toThrow();
    });
  });

  describe('UsersService.changePassword', () => {
    it('should update password, revoke old sessions in one transaction, and return additional accessToken and refreshToken', async () => {
      const oldHash = await bcrypt.hash('CurrentPass123!', 10);
      const user = {
        id: 'u-change-1',
        email: 'user@souqone.om',
        username: 'userchange',
        role: 'USER',
        passwordHash: oldHash,
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(user);
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.refreshToken.create.mockResolvedValue({ token: 'new-hashed-rt' });

      const res = await usersService.changePassword('u-change-1', {
        currentPassword: 'CurrentPass123!',
        newPassword: 'BrandNewPass123!',
      });

      // Response contains existing message AND additional tokens
      expect(res.message).toBe('تم تغيير كلمة المرور بنجاح');
      expect(res.accessToken).toBe('new-jwt-access-token');
      expect(typeof res.refreshToken).toBe('string');
      expect(res.refreshToken.length).toBeGreaterThan(10);

      // Verified transaction and token revocation
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u-change-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('old refresh token after change => rejected during refresh', async () => {
      const oldHashedToken = authTokenService.hashToken('old-token-before-change');
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-revoked-by-change',
        token: oldHashedToken,
        userId: 'u-change-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      });

      await expect(authService.refresh('old-token-before-change')).rejects.toThrow();
    });

    it('another users tokens remain untouched', async () => {
      const userAId = 'user-A';
      const userBId = 'user-B';
      const oldHash = await bcrypt.hash('PassA123!', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userAId,
        passwordHash: oldHash,
      });
      mockPrisma.user.update.mockResolvedValue({ id: userAId });
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.refreshToken.create.mockResolvedValue({ token: 'rt-new-a' });

      await usersService.changePassword(userAId, {
        currentPassword: 'PassA123!',
        newPassword: 'NewPassA123!',
      });

      // User A tokens were revoked
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: userAId, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      // User B tokens were NOT touched
      expect(mockPrisma.refreshToken.updateMany).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: userBId }) }),
      );
    });
  });

  describe('UsersService.getProfile (/users/me)', () => {
    it('should return user profile and throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'u-me',
        email: 'me@souqone.om',
        username: 'meuser',
        displayName: 'Me User',
      });

      const profile = await usersService.getProfile('u-me');
      expect(profile.id).toBe('u-me');
      expect(profile.email).toBe('me@souqone.om');

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(usersService.getProfile('u-missing')).rejects.toThrow(NotFoundException);
    });
  });
});
