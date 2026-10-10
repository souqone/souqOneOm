import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { AuthTokenService } from '../auth-token.service';
import { AuthAuditService } from '../auth-audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { RedisService } from '../../redis/redis.service';
import * as bcrypt from 'bcryptjs';

describe('B3: Google Hardening & Pre-Hijacking Mitigation (AuthService.googleAuth)', () => {
  let authService: AuthService;
  let tokenService: AuthTokenService;

  let verifyIdTokenMock: jest.Mock;

  const mockPrisma: any = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
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

    authService = module.get<AuthService>(AuthService);
    tokenService = module.get<AuthTokenService>(AuthTokenService);

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
    mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.refreshToken.create.mockResolvedValue({ token: 'company-new-rt' });

    const result = await authService.googleAuth({ credential: 'valid-token' });

    expect(result.accessToken).toBe('jwt-access-token-123');
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u-company' },
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
    mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.refreshToken.create.mockResolvedValue({ token: 'victim-new-rt' });

    // Victim logs in via Google
    const loginResult = await authService.googleAuth({ credential: 'victim-google-token' });
    expect(loginResult.accessToken).toBe('jwt-access-token-123');

    // 1. Transaction executed with password wiped to null, codes cleared, isVerified=true, googleId linked
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u-victim' },
        data: expect.objectContaining({
          passwordHash: null,
          googleId: 'victim-google-sub-999',
          isVerified: true,
          emailVerificationCode: null,
          emailVerificationExpiry: null,
          passwordResetCode: null,
          passwordResetExpiry: null,
        }),
      }),
    );

    // 2. Attacker's active refresh tokens were revoked in the transaction
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u-victim', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
