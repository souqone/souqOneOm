import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { AuthTokenService } from '../auth-token.service';
import { AuthAuditService } from '../auth-audit.service';
import { OtpService } from '../otp.service';
import { AccessTokenGate } from '../access-token-gate.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { RedisService } from '../../redis/redis.service';
import { AuthProvider, AccountStatus, UserRole } from '@prisma/client';

describe('Auth Part 5 Unit Tests (Null Email & Dual-Write)', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockMail: any;
  let mockTokens: any;
  let mockAudit: any;
  let mockOtp: any;
  let mockGate: any;

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      authIdentity: {
        upsert: jest.fn(),
      },
      refreshToken: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (cb: any) => {
        if (typeof cb === 'function') {
          return cb(mockPrisma);
        }
        return Promise.all(cb);
      }),
    };

    mockMail = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockTokens = {
      signAccessToken: jest.fn().mockResolvedValue('test-jwt-access-token'),
      generateRefreshToken: jest.fn().mockResolvedValue('test-refresh-token'),
      sanitizeUser: jest.fn().mockImplementation((u) => u),
      revokeAllRefreshTokens: jest.fn().mockResolvedValue(undefined),
    };

    mockAudit = {
      logAudit: jest.fn().mockResolvedValue(undefined),
    };

    mockOtp = {
      issue: jest.fn().mockResolvedValue('123456'),
      verify: jest.fn().mockResolvedValue('VALID'),
      invalidateActive: jest.fn().mockResolvedValue(undefined),
    };

    mockGate = {
      validate: jest.fn().mockResolvedValue({ tv: 0, status: AccountStatus.ACTIVE, role: UserRole.USER }),
      invalidate: jest.fn().mockResolvedValue(undefined),
      setCache: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMail },
        { provide: AuthTokenService, useValue: mockTokens },
        { provide: AuthAuditService, useValue: mockAudit },
        { provide: OtpService, useValue: mockOtp },
        { provide: AccessTokenGate, useValue: mockGate },
        { provide: RedisService, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    (authService as any).googleClient = {
      verifyIdToken: jest.fn(),
    };
  });

  describe('Null Email Protection', () => {
    it('resendVerification returns constant response without sending email or throwing when user.email is null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'phone-user-1',
        email: null,
        phoneE164: '+96891234567',
        isVerified: false,
      });

      const res = await authService.resendVerification('phone-user-1');

      expect(res).toEqual({ message: 'تم إرسال رمز تحقق جديد', emailSent: false });
      expect(mockMail.sendVerificationEmail).not.toHaveBeenCalled();
      expect(mockOtp.issue).not.toHaveBeenCalled();
    });

    it('forgotPassword returns generic message without throwing when user email is not found or null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const res = await authService.forgotPassword('nonexistent@example.com');

      expect(res).toEqual({ message: 'إذا كان البريد مسجلاً ستصلك رسالة' });
      expect(mockMail.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(mockOtp.issue).not.toHaveBeenCalled();
    });

    it('forgotPassword returns generic message when user exists but email is null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-with-no-email',
        email: null,
      });

      const res = await authService.forgotPassword('some@example.com');

      expect(res).toEqual({ message: 'إذا كان البريد مسجلاً ستصلك رسالة' });
      expect(mockMail.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(mockOtp.issue).not.toHaveBeenCalled();
    });
  });

  describe('Dual-Write for AuthIdentity', () => {
    it('googleAuth writes to auth_identities when creating a new user', async () => {
      const googlePayload = {
        email: 'newgoogle@gmail.com',
        sub: 'google-sub-12345',
        name: 'Google User',
        picture: 'https://example.com/avatar.jpg',
        email_verified: true,
      };

      (authService as any).googleClient.verifyIdToken.mockResolvedValue({
        getPayload: () => googlePayload,
      });

      // 1st lookup by googleId => null
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)
        // 2nd lookup by email => null
        .mockResolvedValueOnce(null);

      const createdUser = {
        id: 'user-new-id',
        email: 'newgoogle@gmail.com',
        username: 'newgoogle_abc',
        googleId: 'google-sub-12345',
        isVerified: true,
        tokenVersion: 0,
        status: AccountStatus.ACTIVE,
      };

      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await authService.googleAuth('valid-token-1', '127.0.0.1', 'jest');

      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.authIdentity.upsert).toHaveBeenCalledWith({
        where: {
          provider_providerUserId: {
            provider: AuthProvider.GOOGLE,
            providerUserId: 'google-sub-12345',
          },
        },
        update: { userId: 'user-new-id' },
        create: {
          userId: 'user-new-id',
          provider: AuthProvider.GOOGLE,
          providerUserId: 'google-sub-12345',
        },
      });
      expect(result.accessToken).toBe('test-jwt-access-token');
    });

    it('googleAuth dual-writes to auth_identities on unverified account pre-hijacking link', async () => {
      const googlePayload = {
        email: 'victim@gmail.com',
        sub: 'google-sub-victim',
        name: 'Victim User',
        picture: null,
        email_verified: true,
      };

      (authService as any).googleClient.verifyIdToken.mockResolvedValue({
        getPayload: () => googlePayload,
      });

      const existingUnverifiedUser = {
        id: 'user-victim-id',
        email: 'victim@gmail.com',
        username: 'victim',
        googleId: null,
        isVerified: false,
        passwordHash: 'hash',
        tokenVersion: 0,
        status: AccountStatus.ACTIVE,
      };

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // by googleId
        .mockResolvedValueOnce(existingUnverifiedUser); // by email

      mockPrisma.user.update.mockResolvedValue({
        ...existingUnverifiedUser,
        googleId: 'google-sub-victim',
        isVerified: true,
        passwordHash: null,
      });

      const result = await authService.googleAuth('valid-token-2', '127.0.0.1', 'jest');

      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockPrisma.authIdentity.upsert).toHaveBeenCalledWith({
        where: {
          provider_providerUserId: {
            provider: AuthProvider.GOOGLE,
            providerUserId: 'google-sub-victim',
          },
        },
        update: { userId: 'user-victim-id' },
        create: {
          userId: 'user-victim-id',
          provider: AuthProvider.GOOGLE,
          providerUserId: 'google-sub-victim',
        },
      });
      expect(result.accessToken).toBe('test-jwt-access-token');
    });
  });
});
