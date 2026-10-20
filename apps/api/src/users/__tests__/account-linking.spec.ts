import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GeoService } from '../../locations/geo.service';
import { AuthTokenService } from '../../auth/auth-token.service';
import { AccessTokenGate } from '../../auth/access-token-gate.service';
import { AuthService } from '../../auth/auth.service';
import { OwnerContentVisibilityService } from '../../common/services/owner-content-visibility.service';
import { MailService } from '../../mail/mail.service';
import { AppleTokenVerifierService } from '../../auth/apple-token-verifier.service';
import { AppleRevocationService } from '../../auth/apple-revocation.service';
import { BanBlacklistService } from '../../ban-blacklist/ban-blacklist.service';
import { AuthAuditService } from '../../auth/auth-audit.service';
import { AuthProvider, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

describe('Account Linking & Unlinking (PR 3 — UsersService)', () => {
  let service: UsersService;

  let mockPrisma: any;
  let mockGeoService: any;
  let mockAuthTokenService: any;
  let mockAccessTokenGate: any;
  let mockAuthService: any;
  let mockVisibilityService: any;
  let mockMailService: any;
  let mockAppleTokenVerifier: any;
  let mockAppleRevocationService: any;
  let mockBanBlacklistService: any;
  let mockAuthAuditService: any;

  const validPassword = 'SecretPassword123!';
  let validPasswordHash: string;

  beforeAll(async () => {
    validPasswordHash = await bcrypt.hash(validPassword, 10);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    mockGeoService = {
      validateLocationPair: jest.fn().mockResolvedValue(true),
      syncLocation: jest.fn().mockResolvedValue(undefined),
      clearLocation: jest.fn().mockResolvedValue(undefined),
    };

    mockAuthTokenService = {
      revokeAllRefreshTokens: jest.fn().mockResolvedValue(undefined),
      signAccessToken: jest.fn().mockResolvedValue('new-access-token-xyz'),
      generateRefreshToken: jest.fn().mockResolvedValue('new-refresh-token-xyz'),
    };

    mockAccessTokenGate = {
      invalidate: jest.fn().mockResolvedValue(undefined),
    };

    mockAuthService = {
      verifyGoogleIdToken: jest.fn(),
    };

    mockVisibilityService = {
      hideAllForUser: jest.fn().mockResolvedValue({ totalAffected: 0 }),
      restoreAllForUser: jest.fn().mockResolvedValue({ totalAffected: 0 }),
    };

    mockMailService = {
      sendSocialLinkedEmail: jest.fn().mockResolvedValue(undefined),
      sendSocialUnlinkedEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockAppleTokenVerifier = {
      verifyIdToken: jest.fn(),
    };

    mockAppleRevocationService = {
      exchangeAndRevoke: jest.fn(),
    };

    mockBanBlacklistService = {
      isGoogleBlocked: jest.fn().mockResolvedValue(false),
      isAppleBlocked: jest.fn().mockResolvedValue(false),
    };

    mockAuthAuditService = {
      logAudit: jest.fn().mockResolvedValue(undefined),
    };

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      authIdentity: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      loginAudit: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'mock-user' }]),
      $transaction: jest.fn(async (cb: any) => cb(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GeoService, useValue: mockGeoService },
        { provide: AuthTokenService, useValue: mockAuthTokenService },
        { provide: AccessTokenGate, useValue: mockAccessTokenGate },
        { provide: AuthService, useValue: mockAuthService },
        { provide: OwnerContentVisibilityService, useValue: mockVisibilityService },
        { provide: MailService, useValue: mockMailService },
        { provide: AppleTokenVerifierService, useValue: mockAppleTokenVerifier },
        { provide: AppleRevocationService, useValue: mockAppleRevocationService },
        { provide: BanBlacklistService, useValue: mockBanBlacklistService },
        { provide: AuthAuditService, useValue: mockAuthAuditService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('1. Step-Up Authentication Rules', () => {
    it('requires currentPassword (403 STEP_UP_REQUIRED) when user has passwordHash but no currentPassword is provided for linkGoogle', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user1@example.com',
        displayName: 'User 1',
        passwordHash: validPasswordHash,
        googleId: null,
        appleSub: null,
        status: AccountStatus.ACTIVE,
        deletionScheduledAt: null,
      });

      await expect(
        service.linkGoogle('user-1', { credential: 'google-token-123' }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.FORBIDDEN,
          response: expect.objectContaining({
            code: 'STEP_UP_REQUIRED',
            message: 'يرجى إدخال كلمة المرور الحالية لتأكيد ربط الحساب',
          }),
        }),
      );
    });

    it('throws 403 STEP_UP_REQUIRED when user provides wrong currentPassword', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user1@example.com',
        displayName: 'User 1',
        passwordHash: validPasswordHash,
        googleId: null,
        appleSub: null,
        status: AccountStatus.ACTIVE,
        deletionScheduledAt: null,
      });

      await expect(
        service.linkGoogle('user-1', {
          credential: 'google-token-123',
          currentPassword: 'WrongPassword!',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.FORBIDDEN,
          response: expect.objectContaining({
            code: 'STEP_UP_REQUIRED',
            message: 'كلمة المرور الحالية غير صحيحة لتأكيد ربط الحساب',
          }),
        }),
      );
    });

    it('enforces password step-up even when user email is unverified (hasPassword is false in getLoginMethods, but passwordHash exists)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-unverified',
        email: 'unverified@example.com',
        isVerified: false,
        passwordHash: validPasswordHash,
        googleId: null,
        appleSub: null,
        status: AccountStatus.ACTIVE,
        deletionScheduledAt: null,
      });

      await expect(
        service.linkGoogle('user-unverified', {
          credential: 'google-token-123',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.FORBIDDEN,
          response: expect.objectContaining({
            code: 'STEP_UP_REQUIRED',
          }),
        }),
      );
    });

    it('requires Apple re-authentication (403 STEP_UP_REQUIRED) when passwordless user with linked Apple links Google without Apple token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-apple-only',
        email: 'apple@example.com',
        passwordHash: null,
        googleId: null,
        appleSub: 'apple-sub-777',
        status: AccountStatus.ACTIVE,
        deletionScheduledAt: null,
      });

      await expect(
        service.linkGoogle('user-apple-only', { credential: 'google-token-123' }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.FORBIDDEN,
          response: expect.objectContaining({
            code: 'STEP_UP_REQUIRED',
            message: 'يلزم إعادة تأكيد هويتك عبر Apple لتأكيد ربط الحساب',
          }),
        }),
      );
    });

    it('throws 401 APPLE_SUB_MISMATCH when passwordless user provides Apple token with mismatched sub', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-apple-only',
        email: 'apple@example.com',
        passwordHash: null,
        googleId: null,
        appleSub: 'apple-sub-777',
        status: AccountStatus.ACTIVE,
        deletionScheduledAt: null,
      });

      mockAppleTokenVerifier.verifyIdToken.mockResolvedValue({
        sub: 'attacker-apple-sub',
        email: 'attacker@example.com',
      });

      await expect(
        service.linkGoogle('user-apple-only', {
          credential: 'google-token-123',
          reauthAppleIdToken: 'apple-token-attacker',
          reauthAppleNonce: 'nonce-123',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.UNAUTHORIZED,
          response: expect.objectContaining({
            code: 'APPLE_SUB_MISMATCH',
          }),
        }),
      );
    });

    it('requires Google re-authentication (403 STEP_UP_REQUIRED) when passwordless user with linked Google links Apple without Google token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-google-only',
        email: 'google@example.com',
        passwordHash: null,
        googleId: 'google-id-555',
        appleSub: null,
        status: AccountStatus.ACTIVE,
        deletionScheduledAt: null,
      });

      await expect(
        service.linkApple('user-google-only', {
          identityToken: 'apple-token-123',
          nonce: 'nonce-456',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.FORBIDDEN,
          response: expect.objectContaining({
            code: 'STEP_UP_REQUIRED',
            message: 'يلزم إعادة تأكيد هويتك عبر Google لتأكيد ربط الحساب',
          }),
        }),
      );
    });

    it('allows linking without step-up credential for phone-only passwordless accounts', async () => {
      mockPrisma.user.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'user-phone-only') {
          return Promise.resolve({
            id: 'user-phone-only',
            email: null,
            displayName: 'Phone User',
            passwordHash: null,
            googleId: null,
            appleSub: null,
            status: AccountStatus.ACTIVE,
            deletionScheduledAt: null,
          });
        }
        return Promise.resolve(null);
      });

      mockAuthService.verifyGoogleIdToken.mockResolvedValue({
        sub: 'google-id-new',
        email: 'newuser@gmail.com',
      });

      const res = await service.linkGoogle('user-phone-only', {
        credential: 'google-valid-token',
      });

      expect(res).toEqual({ message: 'تم ربط حساب Google بنجاح' });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-phone-only' },
        data: { googleId: 'google-id-new' },
      });
      expect(mockAuthAuditService.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'LINK_GOOGLE',
          success: true,
          userId: 'user-phone-only',
        }),
      );
    });
  });

  describe('2. Account Status & Pending Deletion Protection', () => {
    it('rejects linking when user.deletionScheduledAt is set', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-pending-del',
        email: 'pending@example.com',
        displayName: 'Pending Deletion',
        passwordHash: validPasswordHash,
        googleId: null,
        appleSub: null,
        status: AccountStatus.ACTIVE,
        deletionScheduledAt: new Date(Date.now() + 86400000),
      });

      await expect(
        service.linkGoogle('user-pending-del', {
          credential: 'google-token-123',
          currentPassword: validPassword,
        }),
      ).rejects.toThrow(
        new ForbiddenException(
          'الحساب مجدول للحذف. يرجى إلغاء طلب الحذف أولاً لتعديل وسائل الدخول.',
        ),
      );
    });

    it('rejects unlinking when user.deletionScheduledAt is set', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-pending-del',
        email: 'pending@example.com',
        displayName: 'Pending Deletion',
        passwordHash: validPasswordHash,
        googleId: 'google-123',
        appleSub: 'apple-123',
        status: AccountStatus.ACTIVE,
        deletionScheduledAt: new Date(Date.now() + 86400000),
      });

      await expect(
        service.unlinkGoogle('user-pending-del', {
          currentPassword: validPassword,
        }),
      ).rejects.toThrow(
        new ForbiddenException(
          'الحساب مجدول للحذف. يرجى إلغاء طلب الحذف أولاً لتعديل وسائل الدخول.',
        ),
      );
    });

    it('rejects linking when user is BANNED', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-banned',
        email: 'banned@example.com',
        displayName: 'Banned User',
        passwordHash: validPasswordHash,
        googleId: null,
        appleSub: null,
        status: AccountStatus.BANNED,
        deletionScheduledAt: null,
      });

      await expect(
        service.linkGoogle('user-banned', {
          credential: 'google-token-123',
          currentPassword: validPassword,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.FORBIDDEN,
          response: expect.objectContaining({
            code: 'ACCOUNT_BANNED',
          }),
        }),
      );
    });
  });

  describe('3. Ban Blacklist Checking', () => {
    it('blocks linking Google when googleId is present in ban blacklist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-clean',
        email: 'clean@example.com',
        displayName: 'Clean User',
        passwordHash: validPasswordHash,
        googleId: null,
        appleSub: null,
        status: AccountStatus.ACTIVE,
        deletionScheduledAt: null,
      });

      mockAuthService.verifyGoogleIdToken.mockResolvedValue({
        sub: 'blocked-google-id-999',
        email: 'blocked@gmail.com',
      });

      mockBanBlacklistService.isGoogleBlocked.mockResolvedValue(true);

      await expect(
        service.linkGoogle('user-clean', {
          credential: 'google-token-blocked',
          currentPassword: validPassword,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.FORBIDDEN,
          response: expect.objectContaining({
            code: 'ACCOUNT_BANNED',
          }),
        }),
      );

      expect(mockAuthAuditService.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'LINK_GOOGLE',
          success: false,
          reason: 'ACCOUNT_BANNED',
        }),
      );
    });

    it('blocks linking Apple when appleSub is present in ban blacklist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-clean',
        email: 'clean@example.com',
        displayName: 'Clean User',
        passwordHash: validPasswordHash,
        googleId: null,
        appleSub: null,
        status: AccountStatus.ACTIVE,
        deletionScheduledAt: null,
      });

      mockAppleTokenVerifier.verifyIdToken.mockResolvedValue({
        sub: 'blocked-apple-sub-888',
        email: 'blocked@icloud.com',
      });

      mockBanBlacklistService.isAppleBlocked.mockResolvedValue(true);

      await expect(
        service.linkApple('user-clean', {
          identityToken: 'apple-token-blocked',
          nonce: 'nonce-123',
          currentPassword: validPassword,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.FORBIDDEN,
          response: expect.objectContaining({
            code: 'ACCOUNT_BANNED',
          }),
        }),
      );

      expect(mockAuthAuditService.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'LINK_APPLE',
          success: false,
          reason: 'ACCOUNT_BANNED',
        }),
      );
    });
  });

  describe('4. Idempotency Behavior', () => {
    it('returns 200 OK without updating when Google account is already linked to current user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user1@example.com',
        displayName: 'User 1',
        passwordHash: validPasswordHash,
        googleId: 'google-id-already-mine',
        appleSub: null,
        status: AccountStatus.ACTIVE,
        deletionScheduledAt: null,
      });

      mockAuthService.verifyGoogleIdToken.mockResolvedValue({
        sub: 'google-id-already-mine',
        email: 'user1@gmail.com',
      });

      const res = await service.linkGoogle('user-1', {
        credential: 'google-token-mine',
        currentPassword: validPassword,
      });

      expect(res).toEqual({ message: 'تم ربط حساب Google بنجاح' });
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.authIdentity.upsert).not.toHaveBeenCalled();
    });

    it('rejects with 409 PROVIDER_ALREADY_LINKED when attempting to link a different Google account while one is already linked', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user1@example.com',
        displayName: 'User 1',
        passwordHash: validPasswordHash,
        googleId: 'existing-google-id',
        appleSub: null,
        status: AccountStatus.ACTIVE,
        deletionScheduledAt: null,
      });

      mockAuthService.verifyGoogleIdToken.mockResolvedValue({
        sub: 'new-different-google-id',
        email: 'user1@gmail.com',
      });

      await expect(
        service.linkGoogle('user-1', {
          credential: 'google-token-new',
          currentPassword: validPassword,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          response: expect.objectContaining({
            code: 'PROVIDER_ALREADY_LINKED',
            message: 'حسابك مرتبط بحساب Google آخر. يرجى إلغاء الربط أولاً.',
          }),
        }),
      );
    });

    it('rejects with 409 PROVIDER_ALREADY_LINKED when attempting to link a different Apple account while one is already linked', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user1@example.com',
        displayName: 'User 1',
        passwordHash: validPasswordHash,
        googleId: null,
        appleSub: 'existing-apple-sub',
        status: AccountStatus.ACTIVE,
        deletionScheduledAt: null,
      });

      mockAppleTokenVerifier.verifyIdToken.mockResolvedValue({
        sub: 'new-different-apple-sub',
        email: 'user1@apple.com',
      });

      await expect(
        service.linkApple('user-1', {
          identityToken: 'apple-token-new',
          nonce: 'nonce-123',
          currentPassword: validPassword,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          response: expect.objectContaining({
            code: 'PROVIDER_ALREADY_LINKED',
            message: 'حسابك مرتبط بحساب Apple آخر. يرجى إلغاء الربط أولاً.',
          }),
        }),
      );
    });

    it('returns 200 OK without token revocation when unlinking a provider that is not linked', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user1@example.com',
        displayName: 'User 1',
        passwordHash: validPasswordHash,
        googleId: null,
        appleSub: null,
        status: AccountStatus.ACTIVE,
        deletionScheduledAt: null,
      });

      const res = await service.unlinkGoogle('user-1', {
        currentPassword: validPassword,
      });

      expect(res).toEqual({ message: 'حساب Google غير مرتبط بالفعل' });
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockAuthTokenService.revokeAllRefreshTokens).not.toHaveBeenCalled();
      expect(mockAccessTokenGate.invalidate).not.toHaveBeenCalled();
    });
  });

  describe('5. Collision on other accounts (User & AuthIdentity consistency)', () => {
    it('throws 409 SOCIAL_ACCOUNT_ALREADY_LINKED without leaking user info if another User has this googleId', async () => {
      mockPrisma.user.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'user-1') {
          return Promise.resolve({
            id: 'user-1',
            email: 'user1@example.com',
            displayName: 'User 1',
            passwordHash: validPasswordHash,
            googleId: null,
            appleSub: null,
            status: AccountStatus.ACTIVE,
            deletionScheduledAt: null,
          });
        }
        if (where.googleId === 'collision-google-id') {
          return Promise.resolve({ id: 'other-user-99' });
        }
        return Promise.resolve(null);
      });

      mockAuthService.verifyGoogleIdToken.mockResolvedValue({
        sub: 'collision-google-id',
        email: 'collision@gmail.com',
      });

      await expect(
        service.linkGoogle('user-1', {
          credential: 'google-token-collision',
          currentPassword: validPassword,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          response: expect.objectContaining({
            code: 'SOCIAL_ACCOUNT_ALREADY_LINKED',
            message: 'حساب Google هذا مرتبط بحساب آخر بالفعل',
          }),
        }),
      );
    });

    it('throws 409 SOCIAL_ACCOUNT_ALREADY_LINKED if another user holds AuthIdentity row without User record match', async () => {
      mockPrisma.user.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'user-1') {
          return Promise.resolve({
            id: 'user-1',
            email: 'user1@example.com',
            displayName: 'User 1',
            passwordHash: validPasswordHash,
            googleId: null,
            appleSub: null,
            status: AccountStatus.ACTIVE,
            deletionScheduledAt: null,
          });
        }
        return Promise.resolve(null);
      });

      mockPrisma.authIdentity.findUnique.mockResolvedValue({
        userId: 'other-user-orphan-identity',
      });

      mockAuthService.verifyGoogleIdToken.mockResolvedValue({
        sub: 'collision-google-id',
        email: 'collision@gmail.com',
      });

      await expect(
        service.linkGoogle('user-1', {
          credential: 'google-token-collision',
          currentPassword: validPassword,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          response: expect.objectContaining({
            code: 'SOCIAL_ACCOUNT_ALREADY_LINKED',
          }),
        }),
      );
    });
  });

  describe('6. Concurrent P2002 Race Condition Handling', () => {
    it('recovers with 200 OK if P2002 conflict was won by the current user', async () => {
      let firstFind = true;
      mockPrisma.user.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'user-1') {
          return Promise.resolve({
            id: 'user-1',
            email: 'user1@example.com',
            displayName: 'User 1',
            passwordHash: validPasswordHash,
            googleId: null,
            appleSub: null,
            status: AccountStatus.ACTIVE,
            deletionScheduledAt: null,
          });
        }
        if (where.googleId === 'race-google-id') {
          if (firstFind) {
            firstFind = false;
            return Promise.resolve(null);
          }
          return Promise.resolve({ id: 'user-1' });
        }
        return Promise.resolve(null);
      });

      mockPrisma.authIdentity.findUnique.mockResolvedValue(null);

      mockAuthService.verifyGoogleIdToken.mockResolvedValue({
        sub: 'race-google-id',
        email: 'race@gmail.com',
      });

      const p2002Error: any = new Error('Unique constraint violation');
      p2002Error.code = 'P2002';
      mockPrisma.$transaction.mockRejectedValueOnce(p2002Error);

      const res = await service.linkGoogle('user-1', {
        credential: 'google-token-race',
        currentPassword: validPassword,
      });

      expect(res).toEqual({ message: 'تم ربط حساب Google بنجاح' });
    });

    it('throws 409 SOCIAL_ACCOUNT_ALREADY_LINKED (never 500) if P2002 conflict was won by a different user', async () => {
      let firstFind = true;
      mockPrisma.user.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'user-1') {
          return Promise.resolve({
            id: 'user-1',
            email: 'user1@example.com',
            displayName: 'User 1',
            passwordHash: validPasswordHash,
            googleId: null,
            appleSub: null,
            status: AccountStatus.ACTIVE,
            deletionScheduledAt: null,
          });
        }
        if (where.googleId === 'race-google-id') {
          if (firstFind) {
            firstFind = false;
            return Promise.resolve(null);
          }
          return Promise.resolve({ id: 'competitor-user-2' });
        }
        return Promise.resolve(null);
      });

      mockPrisma.authIdentity.findUnique.mockResolvedValue(null);

      mockAuthService.verifyGoogleIdToken.mockResolvedValue({
        sub: 'race-google-id',
        email: 'race@gmail.com',
      });

      const p2002Error: any = new Error('Unique constraint violation');
      p2002Error.code = 'P2002';
      mockPrisma.$transaction.mockRejectedValueOnce(p2002Error);

      await expect(
        service.linkGoogle('user-1', {
          credential: 'google-token-race',
          currentPassword: validPassword,
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.CONFLICT,
          response: expect.objectContaining({
            code: 'SOCIAL_ACCOUNT_ALREADY_LINKED',
          }),
        }),
      );
    });
  });

  describe('7. LAST_LOGIN_METHOD Protection on Unlink', () => {
    it('throws 400 LAST_LOGIN_METHOD when unlinking the only remaining login method (Google)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-google-only',
        email: 'google@example.com',
        displayName: 'Google Only',
        passwordHash: null,
        googleId: 'google-id-only',
        appleSub: null,
        phoneE164: null,
        phoneVerifiedAt: null,
        isVerified: true,
        status: AccountStatus.ACTIVE,
        tokenVersion: 1,
        deletionScheduledAt: null,
      });

      await expect(
        service.unlinkGoogle('user-google-only', {
          reauthGoogleIdToken: 'valid-reauth-google',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          response: expect.objectContaining({
            code: 'LAST_LOGIN_METHOD',
            message:
              'لا يمكن إزالة وسيلة الدخول الأخيرة لحسابك. يرجى إضافة وسيلة دخول أخرى أولا.',
          }),
        }),
      );
    });

    it('throws 400 LAST_LOGIN_METHOD when unlinking the only remaining login method (Apple)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-apple-only',
        email: 'apple@example.com',
        displayName: 'Apple Only',
        passwordHash: null,
        googleId: null,
        appleSub: 'apple-sub-only',
        phoneE164: null,
        phoneVerifiedAt: null,
        isVerified: true,
        status: AccountStatus.ACTIVE,
        tokenVersion: 1,
        deletionScheduledAt: null,
      });

      await expect(
        service.unlinkApple('user-apple-only', {
          reauthAppleIdToken: 'valid-reauth-apple',
          reauthAppleNonce: 'valid-nonce',
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          response: expect.objectContaining({
            code: 'LAST_LOGIN_METHOD',
          }),
        }),
      );
    });
  });

  describe('8. Successful Unlinking & Token Rotation', () => {
    it('unlinks Google, bumps tokenVersion, revokes refresh tokens, invalidates gate, and returns new tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-multi-method',
        email: 'multi@example.com',
        displayName: 'Multi User',
        passwordHash: validPasswordHash,
        googleId: 'google-to-unlink',
        appleSub: 'apple-retained',
        phoneE164: null,
        phoneVerifiedAt: null,
        isVerified: true,
        status: AccountStatus.ACTIVE,
        tokenVersion: 3,
        deletionScheduledAt: null,
      });

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-multi-method',
        email: 'multi@example.com',
        displayName: 'Multi User',
        passwordHash: validPasswordHash,
        googleId: null,
        appleSub: 'apple-retained',
        tokenVersion: 4,
      });

      const res = await service.unlinkGoogle('user-multi-method', {
        currentPassword: validPassword,
      });

      expect(res).toEqual({
        message: 'تم إلغاء ربط حساب Google بنجاح',
        accessToken: 'new-access-token-xyz',
        refreshToken: 'new-refresh-token-xyz',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-multi-method' },
        data: {
          googleId: null,
          tokenVersion: { increment: 1 },
        },
      });

      expect(mockPrisma.authIdentity.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-multi-method',
          provider: AuthProvider.GOOGLE,
        },
      });

      expect(mockAuthTokenService.revokeAllRefreshTokens).toHaveBeenCalledWith(
        'user-multi-method',
        expect.anything(),
      );
      expect(mockAccessTokenGate.invalidate).toHaveBeenCalledWith('user-multi-method');
      expect(mockMailService.sendSocialUnlinkedEmail).toHaveBeenCalledWith(
        'multi@example.com',
        'Google',
        'Multi User',
      );
      expect(mockAuthAuditService.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'UNLINK_GOOGLE',
          success: true,
          userId: 'user-multi-method',
        }),
      );
    });
  });

  describe('9. Security Notification Fail-Safe', () => {
    it('does not throw 500 when mailService.sendSocialLinkedEmail fails', async () => {
      mockPrisma.user.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'user-1') {
          return Promise.resolve({
            id: 'user-1',
            email: 'user1@example.com',
            displayName: 'User 1',
            passwordHash: validPasswordHash,
            googleId: null,
            appleSub: null,
            status: AccountStatus.ACTIVE,
            deletionScheduledAt: null,
          });
        }
        return Promise.resolve(null);
      });

      mockAuthService.verifyGoogleIdToken.mockResolvedValue({
        sub: 'google-ok-id',
        email: 'user1@gmail.com',
      });

      mockMailService.sendSocialLinkedEmail.mockRejectedValueOnce(
        new Error('SMTP Transport Failure'),
      );

      const res = await service.linkGoogle('user-1', {
        credential: 'google-token-ok',
        currentPassword: validPassword,
      });

      expect(res).toEqual({ message: 'تم ربط حساب Google بنجاح' });
    });
  });
});
