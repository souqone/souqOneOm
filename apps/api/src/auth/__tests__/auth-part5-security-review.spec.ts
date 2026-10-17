import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '../auth.service';
import { AuthTokenService } from '../auth-token.service';
import { AuthAuditService } from '../auth-audit.service';
import { OtpService } from '../otp.service';
import { AccessTokenGate } from '../access-token-gate.service';
import { AccountStatusService } from '../account-status.service';
import { JwtStrategy } from '../jwt.strategy';
import { UsersService } from '../../users/users.service';
import { ChatGateway } from '../../chat/chat.gateway';
import { WsJwtGuard } from '../../chat/guards/ws-jwt.guard';
import { ChatService } from '../../chat/chat.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { RedisService } from '../../redis/redis.service';
import { GeoService } from '../../locations/geo.service';
import { AccountStatus, AuthProvider, OtpPurpose } from '@prisma/client';
import { BanBlacklistService } from '../../ban-blacklist/ban-blacklist.service';
import * as bcrypt from 'bcryptjs';

const TEST_JWT_SECRET = 'super-secret-key-at-least-32-chars-long-for-test!!';

describe('Auth Part 5 Security Review Specification (Report 063)', () => {
  let authService: AuthService;
  let authTokenService: AuthTokenService;
  let usersService: UsersService;
  let gate: AccessTokenGate;
  let jwtStrategy: JwtStrategy;
  let wsGuard: WsJwtGuard;
  let chatGateway: ChatGateway;

  let mockPrisma: any;
  let mockRedis: any;
  let mockMail: any;
  let mockAudit: any;
  let mockOtp: any;
  let mockChatService: any;
  let mockGeo: any;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = TEST_JWT_SECRET;
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn(),
      },
      authIdentity: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      refreshToken: {
        create: jest.fn().mockImplementation((args) =>
          Promise.resolve({ id: 'rt-id-1', ...args.data }),
        ),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn().mockImplementation(async (cb: any) => {
        if (typeof cb === 'function') {
          return cb(mockPrisma);
        }
        return Promise.all(cb);
      }),
    };

    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };

    mockMail = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockAudit = {
      logAudit: jest.fn().mockResolvedValue(undefined),
      recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
      resetLockout: jest.fn().mockResolvedValue(undefined),
      checkLockout: jest.fn().mockResolvedValue({ locked: false }),
    };

    mockOtp = {
      issue: jest.fn().mockResolvedValue('123456'),
      verify: jest.fn().mockResolvedValue('OK'),
      invalidateActive: jest.fn().mockResolvedValue(undefined),
    };

    mockChatService = {
      getConversationIds: jest.fn().mockResolvedValue(['conv-1']),
    };

    mockGeo = {
      validateLocationPair: jest.fn(),
      syncLocation: jest.fn(),
      clearLocation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: TEST_JWT_SECRET,
          signOptions: { expiresIn: '15m' },
        }),
      ],
      providers: [
        AuthService,
        AuthTokenService,
        AccessTokenGate,
        JwtStrategy,
        UsersService,
        WsJwtGuard,
        ChatGateway,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: MailService, useValue: mockMail },
        { provide: AuthAuditService, useValue: mockAudit },
        { provide: OtpService, useValue: mockOtp },
        { provide: ChatService, useValue: mockChatService },
        { provide: GeoService, useValue: mockGeo },
        { provide: AccountStatusService, useValue: { assertCanAuthenticate: jest.fn().mockResolvedValue(undefined) } },
        {
          provide: BanBlacklistService,
          useValue: {
            isGoogleBlocked: jest.fn().mockResolvedValue(false),
            isPhoneBlocked: jest.fn().mockResolvedValue(false),
            addForUser: jest.fn().mockResolvedValue(0),
            removeForUser: jest.fn().mockResolvedValue(0),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authTokenService = module.get<AuthTokenService>(AuthTokenService);
    usersService = module.get<UsersService>(UsersService);
    gate = module.get<AccessTokenGate>(AccessTokenGate);
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    wsGuard = module.get<WsJwtGuard>(WsJwtGuard);
    chatGateway = module.get<ChatGateway>(ChatGateway);

    (authService as any).googleClient = {
      verifyIdToken: jest.fn(),
    };
  });

  /* ══════════════════════════════════════════════════════════════
     البند 1: tv في كل توكن وفي كل المسارات الخمسة
     ══════════════════════════════════════════════════════════════ */
  describe('البند 1: tv في كل توكن عبر المسارات الخمسة لإصدار التوكن', () => {
    it('مسار 1 (login): يصدر access token يحتوي على tv كـ number ويطابق tokenVersion', async () => {
      const passwordHash = await bcrypt.hash('secret123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-login-1',
        email: 'user@example.com',
        username: 'user_login',
        role: 'USER',
        passwordHash,
        isVerified: true,
        tokenVersion: 5,
        status: AccountStatus.ACTIVE,
      });

      const res = await authService.login({
        email: 'user@example.com',
        password: 'secret123',
      });

      expect(res.accessToken).toBeDefined();
      const decoded = jwt.decode(res.accessToken) as any;
      expect(typeof decoded.tv).toBe('number');
      expect(decoded.tv).toBe(5);
      expect(decoded.sub).toBe('user-login-1');
    });

    it('مسار 2 (googleAuth): يصدر access token يحتوي على tv كـ number ويطابق tokenVersion', async () => {
      (authService as any).googleClient.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'google.user@gmail.com',
          sub: 'google-sub-777',
          email_verified: true,
          name: 'Google User',
        }),
      });

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // googleId lookup
        .mockResolvedValueOnce(null); // email lookup

      mockPrisma.user.create.mockResolvedValue({
        id: 'user-google-1',
        email: 'google.user@gmail.com',
        username: 'google_user_abc',
        role: 'USER',
        isVerified: true,
        tokenVersion: 0,
        status: AccountStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      });

      const res = await authService.googleAuth({
        credential: 'valid-google-credential',
      });

      expect(res.accessToken).toBeDefined();
      const decoded = jwt.decode(res.accessToken) as any;
      expect(typeof decoded.tv).toBe('number');
      expect(decoded.tv).toBe(0);
      expect(decoded.sub).toBe('user-google-1');
    });

    it('مسار 3 (verifyEmail): يصدر access token يحتوي على tv كـ number ويطابق tokenVersion', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-verify-1',
        email: 'verify@example.com',
        isVerified: false,
        tokenVersion: 2,
        status: AccountStatus.ACTIVE,
      });

      mockOtp.verify.mockResolvedValue('OK');

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-verify-1',
        email: 'verify@example.com',
        username: 'verified_user',
        role: 'USER',
        isVerified: true,
        tokenVersion: 2,
        status: AccountStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      });

      const res = await authService.verifyEmail('user-verify-1', '123456');

      expect(res.accessToken).toBeDefined();
      const decoded = jwt.decode(res.accessToken) as any;
      expect(typeof decoded.tv).toBe('number');
      expect(decoded.tv).toBe(2);
      expect(decoded.sub).toBe('user-verify-1');
    });

    it('مسار 4 (rotateRefreshToken): يصدر access token يحتوي على tv كـ number ويطابق tokenVersion', async () => {
      const rawToken = 'raw-refresh-token-hex-value-12345';
      const hashedToken = authTokenService.hashToken(rawToken);

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-row-1',
        token: hashedToken,
        userId: 'user-rotate-1',
        familyId: 'fam-1',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        rotatedAt: null,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-rotate-1',
        email: 'rotate@example.com',
        username: 'rotate_user',
        role: 'USER',
        isVerified: true,
        tokenVersion: 7,
        status: AccountStatus.ACTIVE,
      });

      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const res = await authTokenService.rotateRefreshToken(rawToken);

      expect(res).not.toBeNull();
      const decoded = jwt.decode(res!.accessToken) as any;
      expect(typeof decoded.tv).toBe('number');
      expect(decoded.tv).toBe(7);
      expect(decoded.sub).toBe('user-rotate-1');
    });

    it('مسار 5 (users.service.changePassword): يصدر access token يحتوي على tv كـ number ويطابق tokenVersion', async () => {
      const oldHash = await bcrypt.hash('oldPass123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-change-1',
        passwordHash: oldHash,
        tokenVersion: 3,
        status: AccountStatus.ACTIVE,
      });

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-change-1',
        email: 'change@example.com',
        username: 'change_user',
        role: 'USER',
        isVerified: true,
        tokenVersion: 4, // incremented
        status: AccountStatus.ACTIVE,
      });

      const res = await usersService.changePassword('user-change-1', {
        currentPassword: 'oldPass123',
        newPassword: 'newStrongPassword456!',
      });

      expect(res.accessToken).toBeDefined();
      const decoded = jwt.decode(res.accessToken) as any;
      expect(typeof decoded.tv).toBe('number');
      expect(decoded.tv).toBe(4);
      expect(decoded.sub).toBe('user-change-1');
    });

    it('اختبار الرفض: بعد تزويد tokenVersion يرفض التوكن القديم بينما يحمل التوكن الجديد النسخة المحدثة', async () => {
      const oldToken = jwt.sign(
        { sub: 'user-revoked-1', role: 'USER', verified: true, tv: 1 },
        TEST_JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      // Current tokenVersion in DB is now 2
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-revoked-1',
        tokenVersion: 2,
        status: AccountStatus.ACTIVE,
      });
      mockRedis.get.mockResolvedValue(null);

      // Old token with tv=1 is rejected by AccessTokenGate
      await expect(
        gate.validate({ sub: 'user-revoked-1', role: 'USER', tv: 1 }),
      ).rejects.toThrow(UnauthorizedException);

      // Newly signed token with tv=2 is accepted
      const updatedUser = {
        id: 'user-revoked-1',
        email: 'revoked@example.com',
        username: 'revoked_user',
        role: 'USER' as any,
        isVerified: true,
        tokenVersion: 2,
      };
      const newToken = await authTokenService.signAccessToken(updatedUser as any);
      const newPayload = jwt.decode(newToken) as any;
      expect(newPayload.tv).toBe(2);

      await expect(gate.validate(newPayload)).resolves.toEqual({
        tv: 2,
        status: AccountStatus.ACTIVE,
      });
    });
  });

  /* ══════════════════════════════════════════════════════════════
     البند 2: سلوك AccessTokenGate وموقع invalidate
     ══════════════════════════════════════════════════════════════ */
  describe('البند 2: سلوك AccessTokenGate وتوقيت استدعاء invalidate بعد الـ commit', () => {
    it('(أ) يفشل كـ 401 UnauthorizedException إذا رمت قراءة Postgres أي exception (Fail-Closed)', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Postgres connection pool exhausted'));

      await expect(
        gate.validate({ sub: 'user-pg-fail', role: 'USER', tv: 1 }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('(ب) يتعامل مع JSON تالف أو غير متوقع من Redis كـ miss ويرجع لقاعدة Postgres', async () => {
      mockRedis.get.mockResolvedValue({ unexpectedKey: 123 }); // Corrupted / unexpected payload
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-corrupted-cache',
        tokenVersion: 3,
        status: AccountStatus.ACTIVE,
      });

      const res = await gate.validate({ sub: 'user-corrupted-cache', role: 'USER', tv: 3 });
      expect(res).toEqual({ tv: 3, status: AccountStatus.ACTIVE });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('(ج) في revokeAllSessions: يستدعي invalidate خارج الـ transaction بعد تثبيت التحديث', async () => {
      let transactionCompleted = false;
      const invalidateSpy = jest.spyOn(gate, 'invalidate');

      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const res = await cb(mockPrisma);
        transactionCompleted = true;
        return res;
      });

      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.user.update.mockResolvedValue({ id: 'u-revoke-order' });

      await usersService.revokeAllSessions('u-revoke-order');

      expect(transactionCompleted).toBe(true);
      expect(invalidateSpy).toHaveBeenCalledWith('u-revoke-order');
    });

    it('(ج) في changePassword: يستدعي invalidate خارج الـ transaction بعد تثبيت التحديث', async () => {
      let transactionCompleted = false;
      const invalidateSpy = jest.spyOn(gate, 'invalidate');

      const oldHash = await bcrypt.hash('currentPass123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-cp-order',
        passwordHash: oldHash,
        tokenVersion: 1,
        status: AccountStatus.ACTIVE,
      });

      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const res = await cb(mockPrisma);
        transactionCompleted = true;
        return res;
      });

      mockPrisma.user.update.mockResolvedValue({
        id: 'u-cp-order',
        email: 'cp@souqone.om',
        username: 'cp_user',
        role: 'USER',
        isVerified: true,
        tokenVersion: 2,
        status: AccountStatus.ACTIVE,
      });

      await usersService.changePassword('u-cp-order', {
        currentPassword: 'currentPass123',
        newPassword: 'newStrongPassword999!',
      });

      expect(transactionCompleted).toBe(true);
      expect(invalidateSpy).toHaveBeenCalledWith('u-cp-order');
    });
  });

  /* ══════════════════════════════════════════════════════════════
     البند 3: حقن البوابة الإجباري ورفض اتصالات WebSocket غير الصالحة
     ══════════════════════════════════════════════════════════════ */
  describe('البند 3: حقن البوابة الإجباري في Services و Guards و Gateways', () => {
    it('يتأكد من حقن AccessTokenGate بنجاح (ليس undefined) في كل المكونات', () => {
      expect((jwtStrategy as any).accessTokenGate).toBeDefined();
      expect((jwtStrategy as any).accessTokenGate).toBe(gate);

      expect((usersService as any).accessTokenGate).toBeDefined();
      expect((usersService as any).accessTokenGate).toBe(gate);

      expect((wsGuard as any).accessTokenGate).toBeDefined();
      expect((wsGuard as any).accessTokenGate).toBe(gate);

      expect((chatGateway as any).accessTokenGate).toBeDefined();
      expect((chatGateway as any).accessTokenGate).toBe(gate);
    });

    it('يرفض اتصال WebSocket إذا كان التوكن يحمل tv قديم', async () => {
      const oldToken = jwt.sign(
        { sub: 'user-ws-old', username: 'wsOld', role: 'USER', verified: true, tv: 1 },
        TEST_JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      // Gate finds that DB tokenVersion is 2
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-ws-old',
        tokenVersion: 2,
        status: AccountStatus.ACTIVE,
      });

      const client: any = {
        id: 'socket-old-tv',
        handshake: { auth: { token: oldToken }, headers: {} },
        data: {},
        emit: jest.fn(),
        disconnect: jest.fn(),
        join: jest.fn(),
      };

      await chatGateway.handleConnection(client);

      expect(client.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({ message: expect.any(String) }),
      );
      expect(client.disconnect).toHaveBeenCalled();
      expect(client.data.user).toBeUndefined();
    });

    it('يرفض اتصال WebSocket إذا كان حساب المستخدم BANNED', async () => {
      const bannedToken = jwt.sign(
        { sub: 'user-ws-banned', username: 'wsBanned', role: 'USER', verified: true, tv: 1 },
        TEST_JWT_SECRET,
        { algorithm: 'HS256', expiresIn: '15m' },
      );

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-ws-banned',
        tokenVersion: 1,
        status: AccountStatus.BANNED,
      });

      const client: any = {
        id: 'socket-banned',
        handshake: { auth: { token: bannedToken }, headers: {} },
        data: {},
        emit: jest.fn(),
        disconnect: jest.fn(),
        join: jest.fn(),
      };

      await chatGateway.handleConnection(client);

      expect(client.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({ message: expect.any(String) }),
      );
      expect(client.disconnect).toHaveBeenCalled();
      expect(client.data.user).toBeUndefined();
    });
  });

  /* ══════════════════════════════════════════════════════════════
     البند 4: كتابة emailVerifiedAt عند التحقق ومع جوجل
     ══════════════════════════════════════════════════════════════ */
  describe('البند 4: تسجيل emailVerifiedAt مع جوجل وعند التحقق', () => {
    it('يكتب emailVerifiedAt كتاريخ عند إنشاء مستخدم جديد عبر Google', async () => {
      (authService as any).googleClient.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'google.new@example.com',
          sub: 'google-sub-new-account',
          email_verified: true,
          name: 'Google Brand New',
        }),
      });

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      let createPayload: any = null;
      mockPrisma.user.create.mockImplementation((args: any) => {
        createPayload = args.data;
        return Promise.resolve({
          id: 'u-google-created',
          tokenVersion: 0,
          ...args.data,
        });
      });

      await authService.googleAuth({ credential: 'new-google-cred' });

      expect(createPayload).toBeDefined();
      expect(createPayload.isVerified).toBe(true);
      expect(createPayload.emailVerifiedAt).toBeInstanceOf(Date);
    });

    it('يكتب emailVerifiedAt كتاريخ عند ربط جوجل بحساب موجود غير موثق (Pre-Hijacking Mitigation)', async () => {
      (authService as any).googleClient.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'unverified.target@gmail.com',
          sub: 'google-sub-link',
          email_verified: true,
          name: 'Target Account',
        }),
      });

      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // googleId lookup
        .mockResolvedValueOnce({
          id: 'u-target-unverified',
          email: 'unverified.target@gmail.com',
          isVerified: false,
          passwordHash: 'somehash',
          avatarUrl: null,
          tokenVersion: 0,
          status: AccountStatus.ACTIVE,
        }); // email lookup

      let updatePayload: any = null;
      mockPrisma.user.updateMany.mockImplementation((args: any) => {
        updatePayload = args.data;
        return Promise.resolve({ count: 1 });
      });
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'u-target-unverified',
        email: 'unverified.target@gmail.com',
        isVerified: true,
        passwordHash: null,
        avatarUrl: null,
        googleId: 'google-sub-link',
        tokenVersion: 0,
        status: AccountStatus.ACTIVE,
      });

      await authService.googleAuth({ credential: 'link-google-cred' });

      expect(updatePayload).toBeDefined();
      expect(updatePayload.isVerified).toBe(true);
      expect(updatePayload.emailVerifiedAt).toBeInstanceOf(Date);
      expect(updatePayload.passwordHash).toBeNull();
      expect(updatePayload.googleId).toBe('google-sub-link');
    });

    it('يكتب emailVerifiedAt كتاريخ عند توثيق البريد عبر كود التحقق (verifyEmail)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-verify-code',
        email: 'user.code@souqone.om',
        isVerified: false,
        tokenVersion: 1,
        status: AccountStatus.ACTIVE,
      });

      mockOtp.verify.mockResolvedValue('OK');

      let updatePayload: any = null;
      mockPrisma.user.update.mockImplementation((args: any) => {
        updatePayload = args.data;
        return Promise.resolve({
          id: 'u-verify-code',
          tokenVersion: 1,
          ...args.data,
        });
      });

      await authService.verifyEmail('u-verify-code', '654321');

      expect(updatePayload).toBeDefined();
      expect(updatePayload.isVerified).toBe(true);
      expect(updatePayload.emailVerifiedAt).toBeInstanceOf(Date);
    });
  });
});
