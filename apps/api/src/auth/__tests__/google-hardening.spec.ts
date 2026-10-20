import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { AuthTokenService } from '../auth-token.service';
import { AuthAuditService } from '../auth-audit.service';
import { OtpService } from '../otp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { RedisService } from '../../redis/redis.service';
import { AccessTokenGate } from '../access-token-gate.service';
import { AccountStatusService } from '../account-status.service';
import { BanBlacklistService } from '../../ban-blacklist/ban-blacklist.service';
import { AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

describe('B3: Google Hardening & Pre-Hijacking Mitigation (AuthService.googleAuth)', () => {
  let authService: AuthService;
  let tokenService: AuthTokenService;
  let accountStatusService: AccountStatusService;
  let mockOtp: any;
  let mockBanBlacklistService: any;

  let verifyIdTokenMock: jest.Mock;

  const mockPrisma: any = {
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
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
    authIdentity: {
      upsert: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: jest.fn().mockImplementation(async (cb: any) => {
      if (typeof cb === 'function') return cb(mockPrisma);
      return Promise.all(cb);
    }),
  };

  const mockJwt = {
    signAsync: jest.fn().mockResolvedValue('jwt-access-token-123'),
  };

  const mockMail = {
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

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.user.findUnique = jest.fn();
    mockPrisma.user.create = jest.fn();
    mockPrisma.user.update = jest.fn();
    mockPrisma.user.findUniqueOrThrow = jest.fn();
    mockPrisma.user.updateMany = jest.fn().mockResolvedValue({ count: 1 });

    mockBanBlacklistService = {
      isPhoneBlocked: jest.fn().mockResolvedValue(false),
      isGoogleBlocked: jest.fn().mockResolvedValue(false),
      hashPhone: jest.fn().mockReturnValue('mock-phone-hash'),
      hashGoogle: jest.fn().mockReturnValue('mock-google-hash'),
      addForUser: jest.fn().mockResolvedValue(1),
      removeForUser: jest.fn().mockResolvedValue(1),
    };

    mockOtp = {
      issue: jest.fn().mockResolvedValue('123456'),
      verify: jest.fn().mockResolvedValue('OK'),
      invalidateActive: jest.fn().mockResolvedValue(undefined),
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
        { provide: AccessTokenGate, useValue: { invalidate: jest.fn().mockResolvedValue(undefined), validate: jest.fn().mockResolvedValue({ tv: 0, status: 'ACTIVE', role: 'USER' }) } },
        { provide: AccountStatusService, useValue: { assertCanAuthenticate: jest.fn().mockResolvedValue(undefined) } },
        { provide: BanBlacklistService, useValue: mockBanBlacklistService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    tokenService = module.get<AuthTokenService>(AuthTokenService);
    accountStatusService = module.get<AccountStatusService>(AccountStatusService);

    // Mock OAuth2Client verifyIdToken on the service instance
    verifyIdTokenMock = jest.fn();
    (authService as any).googleClient = {
      verifyIdToken: verifyIdTokenMock,
    };
  });

  /* Matrix 1: Reject unverified Google tokens */
  it('Matrix 1: rejects ID tokens where email_verified !== true with 401', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'unverified@gmail.com',
        sub: 'google-sub-1',
        email_verified: false,
      }),
    });

    let err: any;
    try {
      await authService.googleAuth({ credential: 'token-unverified' });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(UnauthorizedException);
    expect(err?.message).toBe('البريد الإلكتروني لحساب Google غير موثق');
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('Matrix 1b: rejects ID tokens where email_verified is missing with 401', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'unverified2@gmail.com',
        sub: 'google-sub-1',
      }),
    });

    let err: any;
    try {
      await authService.googleAuth({ credential: 'token-no-verified-flag' });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(UnauthorizedException);
    expect(err?.message).toBe('البريد الإلكتروني لحساب Google غير موثق');
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  /* Matrix 2: User exists by googleId (already linked) */
  it('Matrix 2: lookup by googleId first => existing linked account logs in normally', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'already@gmail.com',
        sub: 'existing-google-id',
        email_verified: true,
      }),
    });

    const existingUser = {
      id: 'u-linked',
      email: 'already@gmail.com',
      username: 'already_user',
      role: 'USER',
      googleId: 'existing-google-id',
      isVerified: true,
      passwordHash: null,
    };

    mockPrisma.user.findUnique.mockResolvedValue(existingUser);
    mockPrisma.refreshToken.create.mockResolvedValue({ token: 'rt' });

    const result = await authService.googleAuth({ credential: 'valid-google-cred' });

    expect(result.accessToken).toBe('jwt-access-token-123');
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { googleId: 'existing-google-id' },
    });
    expect(mockMail.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  /* Matrix 3: No user exists with email => creates new user */
  it('Matrix 3: no user with this email => create new user and normal login', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'newuser@gmail.com',
        sub: 'google-new-sub',
        email_verified: true,
        name: 'New Google User',
      }),
    });

    // 1st lookup by googleId => null, 2nd lookup by email => null
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'u-new',
      email: 'newuser@gmail.com',
      username: 'newuser_abc123',
      displayName: 'New Google User',
      googleId: 'google-new-sub',
      isVerified: true,
      role: 'USER',
    });
    mockPrisma.refreshToken.create.mockResolvedValue({ token: 'rt' });

    const result = await authService.googleAuth({ credential: 'valid-cred' });

    expect(result.accessToken).toBe('jwt-access-token-123');
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'newuser@gmail.com',
          googleId: 'google-new-sub',
          isVerified: true,
        }),
      }),
    );
    expect(mockMail.sendWelcomeEmail).toHaveBeenCalledTimes(1);
    expect(mockMail.sendWelcomeEmail).toHaveBeenCalledWith('newuser@gmail.com', 'New Google User');
  });

  it('Matrix 3 (Fail-safe): should not break new Google user registration if sendWelcomeEmail rejects', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'newuser2@gmail.com',
        sub: 'google-new-sub-2',
        email_verified: true,
        name: 'New Google User 2',
      }),
    });

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 'u-new-2',
      email: 'newuser2@gmail.com',
      username: 'newuser2_abc123',
      displayName: 'New Google User 2',
      googleId: 'google-new-sub-2',
      isVerified: true,
      role: 'USER',
    });
    mockPrisma.refreshToken.create.mockResolvedValue({ token: 'rt' });
    mockMail.sendWelcomeEmail.mockRejectedValueOnce(new Error('SMTP down'));

    const result = await authService.googleAuth({ credential: 'valid-cred' });

    expect(result.accessToken).toBe('jwt-access-token-123');
  });

  /* Matrix 4: User exists, but Google is NOT authoritative */
  it('Matrix 4: unverified user exists but Google NOT authoritative => 409 ACCOUNT_LINK_REQUIRED without linking or transaction', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'user@yahoo.com',
        sub: 'google-sub-yahoo',
        email_verified: true,
        // hd is absent!
      }),
    });

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // by googleId
      .mockResolvedValueOnce({
        id: 'u-yahoo',
        email: 'user@yahoo.com',
        isVerified: false,
        passwordHash: 'attacker-password-hash',
      }); // by email

    let err: any;
    try {
      await authService.googleAuth({ credential: 'valid-token' });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(ConflictException);
    expect(err?.getResponse()).toMatchObject({
      code: 'ACCOUNT_LINK_REQUIRED',
    });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockPrisma.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('Matrix 4 (Twin): unverified user exists and Google IS authoritative via hd => replacement happens', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'user@company.com',
        sub: 'google-sub-company',
        email_verified: true,
        hd: 'company.com',
      }),
    });

    const unverifiedAccount = {
      id: 'u-company',
      email: 'user@company.com',
      username: 'company_user',
      isVerified: false,
      passwordHash: 'attacker-password-hash',
      googleId: null,
      avatarUrl: null,
    };

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // by googleId
      .mockResolvedValueOnce(unverifiedAccount); // by email

    mockPrisma.user.update.mockResolvedValue({
      ...unverifiedAccount,
      passwordHash: null,
      googleId: 'google-sub-company',
      isVerified: true,
    });
    mockPrisma.user.findUniqueOrThrow.mockResolvedValueOnce({
      ...unverifiedAccount,
      passwordHash: null,
      googleId: 'google-sub-company',
      isVerified: true,
    });
    mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.refreshToken.create.mockResolvedValue({ token: 'company-new-rt' });

    const result = await authService.googleAuth({ credential: 'valid-token' });

    expect(result.accessToken).toBe('jwt-access-token-123');
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u-company', status: { not: AccountStatus.BANNED } },
        data: expect.objectContaining({
          passwordHash: null,
          googleId: 'google-sub-company',
          isVerified: true,
        }),
      }),
    );
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u-company', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  /* Matrix 5: User exists, Google authoritative, verified with passwordHash */
  it('Matrix 5: user exists, verified, has passwordHash => 409 ACCOUNT_LINK_REQUIRED without linking', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'verified_with_pass@gmail.com',
        sub: 'google-sub-pass',
        email_verified: true,
      }),
    });

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // by googleId
      .mockResolvedValueOnce({
        id: 'u-pass',
        email: 'verified_with_pass@gmail.com',
        isVerified: true,
        passwordHash: '$2a$10$realpasswordhash',
      }); // by email

    let err: any;
    try {
      await authService.googleAuth({ credential: 'valid-token' });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(ConflictException);
    expect(err.getResponse()).toMatchObject({
      code: 'ACCOUNT_LINK_REQUIRED',
    });
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  /* Matrix 6: User exists, verified, NO passwordHash (Google-only) */
  it('Matrix 6: user exists, verified, no passwordHash (Google-only account) => normal login', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'googleonly@gmail.com',
        sub: 'google-sub-only',
        email_verified: true,
      }),
    });

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // by googleId
      .mockResolvedValueOnce({
        id: 'u-google-only',
        email: 'googleonly@gmail.com',
        username: 'googleonly',
        role: 'USER',
        isVerified: true,
        passwordHash: null,
        googleId: 'google-sub-only',
      }); // by email
    mockPrisma.refreshToken.create.mockResolvedValue({ token: 'rt' });

    const res = await authService.googleAuth({ credential: 'valid-token' });
    expect(res.accessToken).toBe('jwt-access-token-123');
  });

  /* New Matrix 6 Hardening Tests (AUTH-P3-FIX) */
  it('verified + no password + googleId mismatch -> 409, no login, no update call', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'mismatch@gmail.com',
        sub: 'google-sub-incoming',
        email_verified: true,
      }),
    });

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // by googleId
      .mockResolvedValueOnce({
        id: 'u-mismatch',
        email: 'mismatch@gmail.com',
        username: 'mismatch_user',
        role: 'USER',
        isVerified: true,
        passwordHash: null,
        googleId: 'google-sub-different',
      }); // by email

    let err: any;
    try {
      await authService.googleAuth({ credential: 'token-mismatch' });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(ConflictException);
    expect(err?.getResponse()).toMatchObject({
      statusCode: 409,
      code: 'ACCOUNT_LINK_REQUIRED',
    });
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('verified + no password + googleId null -> 409, no link', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'nullgoogleid@gmail.com',
        sub: 'google-sub-incoming',
        email_verified: true,
      }),
    });

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // by googleId
      .mockResolvedValueOnce({
        id: 'u-null-google',
        email: 'nullgoogleid@gmail.com',
        username: 'nullgoogle_user',
        role: 'USER',
        isVerified: true,
        passwordHash: null,
        googleId: null,
      }); // by email

    let err: any;
    try {
      await authService.googleAuth({ credential: 'token-null-googleid' });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(ConflictException);
    expect(err?.getResponse()).toMatchObject({
      statusCode: 409,
      code: 'ACCOUNT_LINK_REQUIRED',
    });
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('verified + no password + googleId === sub -> login OK', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'match@gmail.com',
        sub: 'google-sub-matching',
        email_verified: true,
      }),
    });

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // by googleId
      .mockResolvedValueOnce({
        id: 'u-match',
        email: 'match@gmail.com',
        username: 'match_user',
        role: 'USER',
        isVerified: true,
        passwordHash: null,
        googleId: 'google-sub-matching',
      }); // by email
    mockPrisma.refreshToken.create.mockResolvedValue({ token: 'rt' });

    const result = await authService.googleAuth({ credential: 'token-matching' });

    expect(result.accessToken).toBe('jwt-access-token-123');
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  /* Matrix 7: Full Pre-Hijacking Scenario */
  it('Matrix 7 (Pre-Hijacking Mitigation): attacker registers unverified email+password, victim logs in with authoritative Google => attacker password wiped and tokens revoked', async () => {
    const victimEmail = 'victim@gmail.com';
    const attackerPassword = 'AttackerPassword123!';
    const attackerPasswordHash = await bcrypt.hash(attackerPassword, 10);

    // Victim Google ID Token payload
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: victimEmail,
        sub: 'victim-google-sub-999',
        email_verified: true,
        picture: 'https://google.com/avatar.jpg',
      }),
    });

    const unverifiedVictimAccount = {
      id: 'u-victim',
      email: victimEmail,
      username: 'victim_user',
      displayName: 'Victim Name',
      role: 'USER',
      passwordHash: attackerPasswordHash, // Attacker's password
      googleId: null,
      isVerified: false, // Unverified!
      emailVerificationCode: '999888',
      emailVerificationExpiry: new Date(Date.now() + 60000),
      passwordResetCode: '111222',
      passwordResetExpiry: new Date(Date.now() + 60000),
    };

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // by googleId
      .mockResolvedValueOnce(unverifiedVictimAccount); // by email

    mockPrisma.user.update.mockResolvedValue({
      ...unverifiedVictimAccount,
      passwordHash: null,
      googleId: 'victim-google-sub-999',
      isVerified: true,
      emailVerificationCode: null,
      emailVerificationExpiry: null,
      passwordResetCode: null,
      passwordResetExpiry: null,
    });
    mockPrisma.user.findUniqueOrThrow.mockResolvedValueOnce({
      ...unverifiedVictimAccount,
      passwordHash: null,
      googleId: 'victim-google-sub-999',
      isVerified: true,
      emailVerificationCode: null,
      emailVerificationExpiry: null,
      passwordResetCode: null,
      passwordResetExpiry: null,
    });
    mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.refreshToken.create.mockResolvedValue({ token: 'victim-new-rt' });

    // Victim logs in via Google
    const loginResult = await authService.googleAuth({ credential: 'victim-google-token' });
    expect(loginResult.accessToken).toBe('jwt-access-token-123');

    // 1. Transaction executed with password wiped to null, active OTP challenges invalidated, isVerified=true, googleId linked
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u-victim', status: { not: AccountStatus.BANNED } },
        data: expect.objectContaining({
          passwordHash: null,
          googleId: 'victim-google-sub-999',
          isVerified: true,
        }),
      }),
    );
    expect(mockOtp.invalidateActive).toHaveBeenCalledWith('u-victim', 'EMAIL_VERIFY', expect.anything());
    expect(mockOtp.invalidateActive).toHaveBeenCalledWith('u-victim', 'PASSWORD_RESET', expect.anything());

    // 2. Attacker's active refresh tokens were revoked in the transaction
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u-victim', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(mockMail.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  /* Matrix 8: Existing user found by googleId, unverified, authoritative Google -> auto-verified inside transaction */
  it('Matrix 8: existing user found by googleId, unverified, authoritative Google => marks isVerified=true inside tx and invalidates OTPs', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'unverified-google@gmail.com',
        sub: 'linked-google-id-1',
        email_verified: true,
      }),
    });

    const unverifiedUser = {
      id: 'u-unverified-1',
      email: 'unverified-google@gmail.com',
      username: 'unverified_user',
      role: 'USER',
      status: 'ACTIVE',
      googleId: 'linked-google-id-1',
      isVerified: false,
      passwordHash: null,
    };

    const verifiedUser = {
      ...unverifiedUser,
      isVerified: true,
      emailVerifiedAt: new Date(),
    };

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(unverifiedUser) // first lookup by googleId
      .mockResolvedValueOnce(verifiedUser); // inside transaction re-fetch

    mockPrisma.user.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.refreshToken.create.mockResolvedValue({ token: 'new-rt-1' });

    const result = await authService.googleAuth({ credential: 'valid-cred-1' });

    expect(result.accessToken).toBe('jwt-access-token-123');
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'u-unverified-1',
        isVerified: false,
        status: { not: AccountStatus.BANNED },
      },
      data: {
        isVerified: true,
        emailVerifiedAt: expect.any(Date),
      },
    });
    expect(mockOtp.invalidateActive).toHaveBeenCalledWith('u-unverified-1', 'EMAIL_VERIFY', expect.anything());
  });

  /* Matrix 9: Existing user found by googleId, unverified, but Google NOT authoritative => remains unverified */
  it('Matrix 9: existing user found by googleId, unverified, but Google NOT authoritative => remains unverified without update', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'unverified-google@yahoo.com',
        sub: 'linked-google-id-2',
        email_verified: true,
      }),
    });

    const unverifiedUser = {
      id: 'u-unverified-2',
      email: 'unverified-google@yahoo.com',
      username: 'unverified_yahoo',
      role: 'USER',
      status: 'ACTIVE',
      googleId: 'linked-google-id-2',
      isVerified: false,
      passwordHash: null,
    };

    mockPrisma.user.findUnique.mockResolvedValue(unverifiedUser);
    mockPrisma.refreshToken.create.mockResolvedValue({ token: 'new-rt-2' });

    const result = await authService.googleAuth({ credential: 'valid-cred-2' });

    expect(result.accessToken).toBe('jwt-access-token-123');
    expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
    expect(mockOtp.invalidateActive).not.toHaveBeenCalled();
  });

  /* Matrix 10: Existing user found by googleId, already verified => untouched */
  it('Matrix 10: existing user found by googleId, already verified => no update and normal login', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'already-verified@gmail.com',
        sub: 'linked-google-id-3',
        email_verified: true,
      }),
    });

    const verifiedUser = {
      id: 'u-verified-3',
      email: 'already-verified@gmail.com',
      username: 'verified_user',
      role: 'USER',
      status: 'ACTIVE',
      googleId: 'linked-google-id-3',
      isVerified: true,
      passwordHash: null,
    };

    mockPrisma.user.findUnique.mockResolvedValue(verifiedUser);
    mockPrisma.refreshToken.create.mockResolvedValue({ token: 'new-rt-3' });

    const result = await authService.googleAuth({ credential: 'valid-cred-3' });

    expect(result.accessToken).toBe('jwt-access-token-123');
    expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
    expect(mockOtp.invalidateActive).not.toHaveBeenCalled();
  });

  /* Matrix 11: Existing user found by googleId, unverified, but status is BANNED => rejects 403 ACCOUNT_BANNED and isVerified remains false */
  it('Matrix 11: existing user found by googleId, unverified, but status is BANNED => rejects 403 ACCOUNT_BANNED without updating isVerified', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'banned-google@gmail.com',
        sub: 'linked-google-id-4',
        email_verified: true,
      }),
    });

    const bannedUser = {
      id: 'u-banned-4',
      email: 'banned-google@gmail.com',
      username: 'banned_user',
      role: 'USER',
      status: 'BANNED',
      googleId: 'linked-google-id-4',
      isVerified: false,
      passwordHash: null,
    };

    mockPrisma.user.findUnique.mockResolvedValue(bannedUser);
    jest.spyOn(accountStatusService, 'assertCanAuthenticate').mockImplementation(() => {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ACCOUNT_BANNED',
        message: 'تم حظر حسابك بشكل دائم من استخدام المنصة',
      });
    });

    let err: any;
    try {
      await authService.googleAuth({ credential: 'valid-cred-4' });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(ForbiddenException);
    expect(err.getResponse()).toMatchObject({
      statusCode: 403,
      code: 'ACCOUNT_BANNED',
    });
    // Crucial check: verify that isVerified was NOT updated in DB
    expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
    expect(mockOtp.invalidateActive).not.toHaveBeenCalled();
  });

  /* Matrix 12: Existing user found by googleId, unverified, authoritative Google, but stored email differs from Google token email => remains unverified without update */
  it('Matrix 12: existing user found by googleId, unverified, but stored email differs from token email => remains unverified without update', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'token-email@gmail.com',
        sub: 'linked-google-id-5',
        email_verified: true,
      }),
    });

    const unverifiedUser = {
      id: 'u-unverified-mismatch-5',
      email: 'stored-different-email@gmail.com',
      username: 'mismatch_user',
      role: 'USER',
      status: 'ACTIVE',
      googleId: 'linked-google-id-5',
      isVerified: false,
      passwordHash: null,
    };

    mockPrisma.user.findUnique.mockResolvedValue(unverifiedUser);
    mockPrisma.refreshToken.create.mockResolvedValue({ token: 'new-rt-5' });

    const result = await authService.googleAuth({ credential: 'valid-cred-5' });

    expect(result.accessToken).toBe('jwt-access-token-123');
    expect(result.user.isVerified).toBe(false);
    expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
    expect(mockOtp.invalidateActive).not.toHaveBeenCalled();
  });

  /* Matrix 13: Path 1 - New user from Google, but googleId is blacklisted => 403 ACCOUNT_BANNED */
  it('Matrix 13: Path 1 - new user registration with blacklisted Google sub rejects with 403 ACCOUNT_BANNED', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'banned-new@gmail.com',
        sub: 'google-sub-blacklisted-1',
        email_verified: true,
      }),
    });

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockBanBlacklistService.isGoogleBlocked.mockResolvedValueOnce(true);

    let err: any;
    try {
      await authService.googleAuth({ credential: 'token-blacklisted-new' });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(ForbiddenException);
    expect(err.getResponse()).toMatchObject({
      statusCode: 403,
      code: 'ACCOUNT_BANNED',
      message: 'تم حظر حسابك لمخالفة شروط الاستخدام',
    });
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  /* Matrix 14: Path 2 - Email linking for unverified user with blacklisted Google sub => 403 ACCOUNT_BANNED */
  it('Matrix 14: Path 2 - email linking with blacklisted Google sub rejects with 403 ACCOUNT_BANNED', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'victim@gmail.com',
        sub: 'google-sub-blacklisted-2',
        email_verified: true,
      }),
    });

    // Lookup by googleId => null, rejected before email lookup
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    mockBanBlacklistService.isGoogleBlocked.mockResolvedValueOnce(true);

    let err: any;
    try {
      await authService.googleAuth({ credential: 'token-blacklisted-link' });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(ForbiddenException);
    expect(err.getResponse()).toMatchObject({
      statusCode: 403,
      code: 'ACCOUNT_BANNED',
    });
    expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
  });

  /* Matrix 15: Path 2 - Concurrent ban during email linking => updateMany count 0 => 403 ACCOUNT_BANNED */
  it('Matrix 15: Path 2 - concurrent ban during email linking rejects with 403 ACCOUNT_BANNED', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'victim-race@gmail.com',
        sub: 'google-sub-allowed-3',
        email_verified: true,
      }),
    });

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'u-unverified-race',
        email: 'victim-race@gmail.com',
        isVerified: false,
        googleId: null,
      });

    mockBanBlacklistService.isGoogleBlocked.mockResolvedValueOnce(false);
    mockPrisma.user.updateMany.mockResolvedValueOnce({ count: 0 }); // Target became BANNED concurrently!

    let err: any;
    try {
      await authService.googleAuth({ credential: 'token-race-link' });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(ForbiddenException);
    expect(err.getResponse()).toMatchObject({
      statusCode: 403,
      code: 'ACCOUNT_BANNED',
    });
  });

  /* Matrix 16: Path 3 - Concurrent ban on unverified user found by googleId => updateMany count 0 => 403 ACCOUNT_BANNED */
  it('Matrix 16: Path 3 - concurrent ban during unverified googleId verification rejects with 403 ACCOUNT_BANNED', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'linked-unverified@gmail.com',
        sub: 'google-sub-linked-unverified',
        email_verified: true,
      }),
    });

    const unverifiedUser = {
      id: 'u-linked-unverified',
      email: 'linked-unverified@gmail.com',
      googleId: 'google-sub-linked-unverified',
      isVerified: false,
      status: 'ACTIVE',
    };

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(unverifiedUser)
      .mockResolvedValueOnce({ id: 'u-linked-unverified', status: 'BANNED' }); // Second lookup finds BANNED

    mockPrisma.user.updateMany.mockResolvedValueOnce({ count: 0 });

    let err: any;
    try {
      await authService.googleAuth({ credential: 'token-linked-race' });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(ForbiddenException);
    expect(err.getResponse()).toMatchObject({
      statusCode: 403,
      code: 'ACCOUNT_BANNED',
    });
  });

  /* Matrix 17: Path near line 349 - verified user without googleId with blacklisted Google sub => 403 ACCOUNT_BANNED */
  it('Matrix 17: Path near line 349 - verified user with blacklisted Google sub rejects with 403 without leaking link required', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'verified-no-pass@gmail.com',
        sub: 'google-sub-blacklisted-4',
        email_verified: true,
      }),
    });

    mockPrisma.user.findUnique.mockResolvedValueOnce(null); // lookup by googleId
    mockBanBlacklistService.isGoogleBlocked.mockResolvedValueOnce(true);

    let err: any;
    try {
      await authService.googleAuth({ credential: 'token-verified-no-pass' });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(ForbiddenException);
    expect(err.getResponse()).toMatchObject({
      statusCode: 403,
      code: 'ACCOUNT_BANNED',
    });
    expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
  });

  /* Matrix 18: P2002 collision handling on user creation race condition */
  it('Matrix 18: re-fetches existing user when P2002 collision occurs on googleId during registration race', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'newuser-race@gmail.com',
        sub: 'google-sub-race-1',
        email_verified: true,
        name: 'Race User',
      }),
    });

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // lookup by googleId
      .mockResolvedValueOnce(null); // lookup by email

    const subCollisionErr: any = new Error('Unique constraint failed on googleId');
    subCollisionErr.code = 'P2002';
    subCollisionErr.meta = { target: ['googleId'] };
    mockPrisma.user.create.mockRejectedValueOnce(subCollisionErr);

    const winnerUser = {
      id: 'u-winner-google',
      email: 'newuser-race@gmail.com',
      username: 'newuser_winner',
      googleId: 'google-sub-race-1',
      role: 'USER',
      status: 'ACTIVE',
      isVerified: true,
    };
    mockPrisma.user.findUnique.mockResolvedValueOnce(winnerUser); // recovery lookup by googleId

    const result = await authService.googleAuth({ credential: 'token-race' });
    expect(result).toHaveProperty('accessToken');
    expect(mockPrisma.authIdentity.upsert).not.toHaveBeenCalled();
  });

  it('Matrix 19: throws 409 ACCOUNT_LINK_REQUIRED when P2002 collision occurs on email without user by googleId', async () => {
    verifyIdTokenMock.mockResolvedValue({
      getPayload: () => ({
        email: 'collision-email@gmail.com',
        sub: 'google-sub-race-2',
        email_verified: true,
      }),
    });

    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // lookup by googleId
      .mockResolvedValueOnce(null); // lookup by email

    const emailCollisionErr: any = new Error('Unique constraint failed on email');
    emailCollisionErr.code = 'P2002';
    emailCollisionErr.meta = { target: 'email' };
    mockPrisma.user.create.mockRejectedValueOnce(emailCollisionErr);

    mockPrisma.user.findUnique.mockResolvedValueOnce(null); // check by googleId returns null

    let err: any;
    try {
      await authService.googleAuth({ credential: 'token-race-email' });
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(ConflictException);
    expect(err.getResponse()).toEqual({
      statusCode: 409,
      code: 'ACCOUNT_LINK_REQUIRED',
      message: 'هذا البريد مسجل مسبقاً. يرجى تسجيل الدخول بحسابك أولاً، ثم ربط حساب Google من الملف الشخصي.',
    });
  });
});

