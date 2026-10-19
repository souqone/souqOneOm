import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { AuthTokenService } from '../auth-token.service';
import { AuthAuditService } from '../auth-audit.service';
import { AppleTokenVerifierService } from '../apple-token-verifier.service';
import { OtpService } from '../otp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { RedisService } from '../../redis/redis.service';
import { AccessTokenGate } from '../access-token-gate.service';
import { AccountStatusService } from '../account-status.service';
import { BanBlacklistService } from '../../ban-blacklist/ban-blacklist.service';
import { AccountStatus, AuthProvider } from '@prisma/client';

describe('Apple Auth Endpoint & Flow (AuthService.appleAuth)', () => {
  let authService: AuthService;
  let mockAppleVerifier: any;
  let mockBanBlacklistService: any;
  let mockAccountStatusService: any;
  let mockOtp: any;
  let mockMail: any;
  let mockPrisma: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      authIdentity: {
        upsert: jest.fn().mockResolvedValue({}),
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
        if (typeof cb === 'function') return cb(mockPrisma);
        return Promise.all(cb);
      }),
    };

    mockAppleVerifier = {
      verifyIdToken: jest.fn(),
    };

    mockBanBlacklistService = {
      isAppleBlocked: jest.fn().mockResolvedValue(false),
      hashApple: jest.fn().mockReturnValue('mock-apple-hash'),
      addForUser: jest.fn().mockResolvedValue(1),
      removeForUser: jest.fn().mockResolvedValue(1),
    };

    mockAccountStatusService = {
      assertCanAuthenticate: jest.fn().mockResolvedValue(undefined),
    };

    mockOtp = {
      issue: jest.fn().mockResolvedValue('123456'),
      verify: jest.fn().mockResolvedValue('OK'),
      invalidateActive: jest.fn().mockResolvedValue(undefined),
    };

    mockMail = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      incr: jest.fn().mockResolvedValue(1),
      getTTL: jest.fn().mockResolvedValue(900),
    };

    const mockJwt = {
      signAsync: jest.fn().mockResolvedValue('jwt-access-token-apple'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        AuthTokenService,
        AuthAuditService,
        { provide: AppleTokenVerifierService, useValue: mockAppleVerifier },
        { provide: BanBlacklistService, useValue: mockBanBlacklistService },
        { provide: AccountStatusService, useValue: mockAccountStatusService },
        { provide: OtpService, useValue: mockOtp },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: MailService, useValue: mockMail },
        { provide: RedisService, useValue: mockRedis },
        {
          provide: AccessTokenGate,
          useValue: {
            invalidate: jest.fn().mockResolvedValue(undefined),
            validate: jest.fn().mockResolvedValue({ tv: 0, status: 'ACTIVE', role: 'USER' }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('Blacklist enforcement', () => {
    it('rejects blacklisted appleSub with 403 ACCOUNT_BANNED before any DB lookup', async () => {
      mockAppleVerifier.verifyIdToken.mockResolvedValue({
        sub: '001234.banned.sub',
        email: 'banned@privaterelay.appleid.com',
      });
      mockBanBlacklistService.isAppleBlocked.mockResolvedValue(true);

      let err: any;
      try {
        await authService.appleAuth({
          identityToken: 'mock-token',
          nonce: 'raw-nonce-123',
        });
      } catch (e) {
        err = e;
      }

      expect(err).toBeInstanceOf(ForbiddenException);
      expect(err.getResponse()).toEqual({
        statusCode: 403,
        code: 'ACCOUNT_BANNED',
        message: 'تم حظر حسابك لمخالفة شروط الاستخدام',
      });
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('Existing user login', () => {
    it('logs in existing user by appleSub and returns session tokens', async () => {
      const existingUser = {
        id: 'u-apple-1',
        email: 'user@apple.com',
        username: 'apple_user_1',
        displayName: 'مستخدم آبل',
        appleSub: '001234.existing.sub',
        isVerified: true,
        status: AccountStatus.ACTIVE,
        role: 'USER',
        tokenVersion: 1,
      };

      mockAppleVerifier.verifyIdToken.mockResolvedValue({
        sub: '001234.existing.sub',
        email: 'user@apple.com',
      });
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      const result = await authService.appleAuth({
        identityToken: 'mock-token',
        nonce: 'raw-nonce-123',
      });

      expect(result.accessToken).toBe('jwt-access-token-apple');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe('u-apple-1');
      expect(mockAccountStatusService.assertCanAuthenticate).toHaveBeenCalledWith(existingUser);
      expect(mockPrisma.loginAudit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'user@apple.com',
            userId: 'u-apple-1',
            method: 'APPLE',
            success: true,
          }),
        }),
      );
    });

    it('updates email verification for unverified user with matching email on login', async () => {
      const unverifiedUser = {
        id: 'u-apple-unverified',
        email: 'unverified@apple.com',
        username: 'apple_unverified',
        displayName: 'مستخدم غير موثق',
        appleSub: '001234.unverified.sub',
        isVerified: false,
        status: AccountStatus.ACTIVE,
        role: 'USER',
        tokenVersion: 1,
      };

      mockAppleVerifier.verifyIdToken.mockResolvedValue({
        sub: '001234.unverified.sub',
        email: 'unverified@apple.com',
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce(unverifiedUser);
      mockPrisma.user.updateMany.mockResolvedValueOnce({ count: 1 });
      mockPrisma.user.findUnique.mockResolvedValueOnce({ ...unverifiedUser, isVerified: true });

      const result = await authService.appleAuth({
        identityToken: 'mock-token',
        nonce: 'raw-nonce-123',
      });

      expect(result.user.id).toBe('u-apple-unverified');
      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'u-apple-unverified',
          isVerified: false,
          status: { not: AccountStatus.BANNED },
        },
        data: {
          isVerified: true,
          emailVerifiedAt: expect.any(Date),
        },
      });
      expect(mockOtp.invalidateActive).toHaveBeenCalled();
    });

    it('rejects if existing user is BANNED in update verification race', async () => {
      const unverifiedUser = {
        id: 'u-apple-banned-race',
        email: 'banned@apple.com',
        username: 'apple_banned_race',
        appleSub: '001234.banned.race',
        isVerified: false,
        status: AccountStatus.ACTIVE,
      };

      mockAppleVerifier.verifyIdToken.mockResolvedValue({
        sub: '001234.banned.race',
        email: 'banned@apple.com',
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce(unverifiedUser);
      // count: 0 (blocked because status is BANNED)
      mockPrisma.user.updateMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.user.findUnique.mockResolvedValueOnce({ status: AccountStatus.BANNED });

      await expect(
        authService.appleAuth({
          identityToken: 'mock-token',
          nonce: 'raw-nonce-123',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('New user registration', () => {
    it('creates new user with fullName, dual-writes to authIdentity, and sends welcome email', async () => {
      mockAppleVerifier.verifyIdToken.mockResolvedValue({
        sub: '001234.new.sub',
        email: 'salim.test@privaterelay.appleid.com',
      });
      // User not found by appleSub
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      // User not found by email
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const createdUser = {
        id: 'u-new-1',
        email: 'salim.test@privaterelay.appleid.com',
        username: 'apple_1234abcd',
        displayName: 'سالم المعمري',
        appleSub: '001234.new.sub',
        isVerified: true,
        status: AccountStatus.ACTIVE,
        role: 'USER',
        tokenVersion: 0,
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await authService.appleAuth({
        identityToken: 'mock-token',
        nonce: 'raw-nonce-123',
        fullName: {
          givenName: 'سالم',
          familyName: 'المعمري',
        },
      });

      expect(result.user.id).toBe('u-new-1');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'salim.test@privaterelay.appleid.com',
          username: expect.stringMatching(/^apple_[a-f0-9]{8}$/),
          displayName: 'سالم المعمري',
          appleSub: '001234.new.sub',
          isVerified: true,
          emailVerifiedAt: expect.any(Date),
        }),
      });

      // Dual-write check
      expect(mockPrisma.authIdentity.upsert).toHaveBeenCalledWith({
        where: {
          provider_providerUserId: {
            provider: AuthProvider.APPLE,
            providerUserId: '001234.new.sub',
          },
        },
        update: { userId: 'u-new-1' },
        create: {
          userId: 'u-new-1',
          provider: AuthProvider.APPLE,
          providerUserId: '001234.new.sub',
        },
      });

      // Welcome email check
      expect(mockMail.sendWelcomeEmail).toHaveBeenCalledWith(
        'salim.test@privaterelay.appleid.com',
        'سالم المعمري',
      );
    });

    it('defaults displayName to "مستخدم سوق ون" when fullName is absent or empty', async () => {
      mockAppleVerifier.verifyIdToken.mockResolvedValue({
        sub: '001234.no-name.sub',
        email: 'noname@example.com',
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      mockPrisma.user.create.mockResolvedValue({
        id: 'u-noname',
        email: 'noname@example.com',
        username: 'apple_abcdef12',
        displayName: 'مستخدم سوق ون',
        appleSub: '001234.no-name.sub',
        isVerified: true,
        status: AccountStatus.ACTIVE,
        role: 'USER',
        tokenVersion: 0,
      });

      await authService.appleAuth({
        identityToken: 'mock-token',
        nonce: 'raw-nonce-123',
        fullName: { givenName: '   ', familyName: '' },
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          displayName: 'مستخدم سوق ون',
        }),
      });
    });

    it('accepts Apple private relay email and stores as verified', async () => {
      mockAppleVerifier.verifyIdToken.mockResolvedValue({
        sub: '001234.relay.sub',
        email: 'relay_xyz123@privaterelay.appleid.com',
        is_private_email: true,
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      mockPrisma.user.create.mockResolvedValue({
        id: 'u-relay',
        email: 'relay_xyz123@privaterelay.appleid.com',
        username: 'apple_55667788',
        displayName: 'مستخدم سوق ون',
        appleSub: '001234.relay.sub',
        isVerified: true,
        status: AccountStatus.ACTIVE,
        role: 'USER',
        tokenVersion: 0,
      });

      const res = await authService.appleAuth({
        identityToken: 'mock-token',
        nonce: 'raw-nonce-123',
      });

      expect(res.user.email).toBe('relay_xyz123@privaterelay.appleid.com');
      expect(res.user.isVerified).toBe(true);
    });

    it('rejects new user without email with 400 APPLE_EMAIL_REQUIRED', async () => {
      mockAppleVerifier.verifyIdToken.mockResolvedValue({
        sub: '001234.no-email.sub',
        // No email in token
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      let err: any;
      try {
        await authService.appleAuth({
          identityToken: 'mock-token',
          nonce: 'raw-nonce-123',
        });
      } catch (e) {
        err = e;
      }

      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.getResponse()).toEqual({
        statusCode: 400,
        code: 'APPLE_EMAIL_REQUIRED',
        message:
          'تعذّر الحصول على بريدك من Apple. افتح إعدادات Apple ID ثم تسجيل الدخول باستخدام Apple، وأزل تطبيق سوق ون ثم أعد المحاولة.',
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('retries username generation on unique collision P2002 up to 5 times', async () => {
      mockAppleVerifier.verifyIdToken.mockResolvedValue({
        sub: '001234.collision.sub',
        email: 'collision@apple.com',
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const collisionError: any = new Error('Unique constraint failed');
      collisionError.code = 'P2002';
      collisionError.meta = { target: ['username'] };

      mockPrisma.user.create
        .mockRejectedValueOnce(collisionError)
        .mockResolvedValueOnce({
          id: 'u-collision-retry',
          email: 'collision@apple.com',
          username: 'apple_retry_winner',
          displayName: 'مستخدم سوق ون',
          appleSub: '001234.collision.sub',
          isVerified: true,
          status: AccountStatus.ACTIVE,
          role: 'USER',
          tokenVersion: 0,
        });

      const res = await authService.appleAuth({
        identityToken: 'mock-token',
        nonce: 'raw-nonce-123',
      });

      expect(res.user.id).toBe('u-collision-retry');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('Existing email conflict & Pre-hijacking handling', () => {
    it('rejects with 409 ACCOUNT_LINK_REQUIRED when email belongs to an existing verified user', async () => {
      mockAppleVerifier.verifyIdToken.mockResolvedValue({
        sub: '001234.attacker.or.new',
        email: 'existing-verified@example.com',
      });
      // User not found by appleSub
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      // User found by email (already verified)
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'u-existing-verified',
        email: 'existing-verified@example.com',
        isVerified: true,
        passwordHash: 'some-hash',
        googleId: null,
        appleSub: null,
      });

      let err: any;
      try {
        await authService.appleAuth({
          identityToken: 'mock-token',
          nonce: 'raw-nonce-123',
        });
      } catch (e) {
        err = e;
      }

      expect(err).toBeInstanceOf(ConflictException);
      expect(err.getResponse()).toEqual({
        statusCode: 409,
        code: 'ACCOUNT_LINK_REQUIRED',
        message:
          'هذا البريد مسجل بوسيلة دخول أخرى. سجّل الدخول بها ثم اربط حساب Apple من إعدادات الحساب.',
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
    });

    it('links appleSub and verifies account for unverified existing user (pre-hijacking mitigation)', async () => {
      mockAppleVerifier.verifyIdToken.mockResolvedValue({
        sub: '001234.legit.apple',
        email: 'unverified-victim@example.com',
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'u-victim-id',
        email: 'unverified-victim@example.com',
        isVerified: false,
        passwordHash: 'fake-attacker-hash',
        appleSub: null,
      });

      mockPrisma.user.updateMany.mockResolvedValueOnce({ count: 1 });
      mockPrisma.user.findUniqueOrThrow.mockResolvedValueOnce({
        id: 'u-victim-id',
        email: 'unverified-victim@example.com',
        username: 'victim_user',
        displayName: 'مستخدم سوق ون',
        appleSub: '001234.legit.apple',
        isVerified: true,
        status: AccountStatus.ACTIVE,
        role: 'USER',
        tokenVersion: 1,
      });

      const res = await authService.appleAuth({
        identityToken: 'mock-token',
        nonce: 'raw-nonce-123',
      });

      expect(res.user.id).toBe('u-victim-id');
      // Verifies that passwordHash was wiped, appleSub linked, and isVerified set
      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'u-victim-id',
          status: { not: AccountStatus.BANNED },
        },
        data: {
          passwordHash: null,
          appleSub: '001234.legit.apple',
          isVerified: true,
          emailVerifiedAt: expect.any(Date),
        },
      });

      // Dual-write to authIdentity
      expect(mockPrisma.authIdentity.upsert).toHaveBeenCalledWith({
        where: {
          provider_providerUserId: {
            provider: AuthProvider.APPLE,
            providerUserId: '001234.legit.apple',
          },
        },
        update: { userId: 'u-victim-id' },
        create: {
          userId: 'u-victim-id',
          provider: AuthProvider.APPLE,
          providerUserId: '001234.legit.apple',
        },
      });

      // Cleans up OTPs and revokes all active refresh tokens
      expect(mockOtp.invalidateActive).toHaveBeenCalled();
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled();
    });
  });

  describe('Account status enforcement (banned, suspended, deleted)', () => {
    it('throws ForbiddenException when accountStatusService reports ACCOUNT_SUSPENDED', async () => {
      mockAppleVerifier.verifyIdToken.mockResolvedValue({
        sub: '001234.suspended.sub',
        email: 'suspended@apple.com',
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-suspended',
        email: 'suspended@apple.com',
        appleSub: '001234.suspended.sub',
        status: AccountStatus.SUSPENDED,
      });

      mockAccountStatusService.assertCanAuthenticate.mockRejectedValueOnce(
        new ForbiddenException({
          statusCode: 403,
          code: 'ACCOUNT_SUSPENDED',
          message: 'تم إيقاف حسابك مؤقتاً',
          suspendedUntil: '2026-11-01T00:00:00.000Z',
        }),
      );

      await expect(
        authService.appleAuth({
          identityToken: 'mock-token',
          nonce: 'raw-nonce-123',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws UnauthorizedException when accountStatusService reports DELETED status', async () => {
      mockAppleVerifier.verifyIdToken.mockResolvedValue({
        sub: '001234.deleted.sub',
        email: 'deleted@apple.com',
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-deleted',
        email: 'deleted@apple.com',
        appleSub: '001234.deleted.sub',
        status: AccountStatus.DELETED,
      });

      mockAccountStatusService.assertCanAuthenticate.mockRejectedValueOnce(
        new UnauthorizedException('بيانات الدخول غير صحيحة'),
      );

      await expect(
        authService.appleAuth({
          identityToken: 'mock-token',
          nonce: 'raw-nonce-123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
