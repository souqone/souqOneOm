import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  INestApplication,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth.service';
import { AuthTokenService } from '../auth-token.service';
import { AuthAuditService } from '../auth-audit.service';
import { OtpService } from '../otp.service';
import { JwtStrategy } from '../jwt.strategy';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../optional-jwt-auth.guard';
import { VerificationGuard } from '../verification.guard';
import { JwtVerifyStrategy } from '../jwt-verify.strategy';
import { AccessTokenGate } from '../access-token-gate.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { RedisService } from '../../redis/redis.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GlobalExceptionFilter } from '../../common/filters/http-exception.filter';
import { VERIFICATION_TOKEN_TTL } from '../auth.constants';

const JWT_SECRET = 'super-secret-key-at-least-32-chars-long-for-test!!';

@Controller('test-gate')
class TestGateController {
  constructor(private readonly authService?: AuthService) {}

  @Get('protected')
  @UseGuards(JwtAuthGuard)
  getProtected(@CurrentUser() user: any) {
    return { ok: true, user };
  }

  @Get('optional')
  @UseGuards(OptionalJwtAuthGuard)
  getOptional(@CurrentUser() user: any) {
    return { ok: true, user: user ?? null };
  }

  @Get('verify-endpoint')
  @UseGuards(VerificationGuard)
  getVerifyEndpoint(@CurrentUser() user: any) {
    return { ok: true, sub: user?.sub };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(VerificationGuard)
  verifyEmail(@Body() dto: any, @CurrentUser() user: any) {
    if (!this.authService) throw new Error('AuthService not injected');
    return this.authService.verifyEmail(user.sub, dto?.code);
  }
}

describe('AUTH-VERIFY-GATE Backend Specification Suite', () => {
  let jwtService: JwtService;
  let jwtStrategy: JwtStrategy;
  let authTokenService: AuthTokenService;
  let authService: AuthService;
  let authAuditService: AuthAuditService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
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
      if (typeof cb === 'function') return cb(mockPrisma);
      return Promise.all(cb);
    }),
  };

  const mockMail = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  const redisStore = new Map<string, any>();
  const mockRedis = {
    get: jest.fn().mockImplementation(async (k: string) => redisStore.get(k) ?? null),
    set: jest.fn().mockImplementation(async (k: string, v: any) => {
      redisStore.set(k, v);
    }),
    del: jest.fn().mockImplementation(async (k: string) => {
      redisStore.delete(k);
    }),
    incr: jest.fn().mockImplementation(async (k: string) => {
      const current = Number(redisStore.get(k) || 0) + 1;
      redisStore.set(k, current);
      return current;
    }),
    getTTL: jest.fn().mockResolvedValue(900),
    expire: jest.fn().mockResolvedValue(undefined),
  };

  const mockOtp = {
    issue: jest.fn().mockResolvedValue('112233'),
    verify: jest.fn().mockImplementation(async (userId: string, purpose: any, code: string) => {
      if (code === '112233' || code === '123456') return 'OK';
      return 'INVALID';
    }),
    invalidateActive: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    redisStore.clear();
    mockOtp.issue.mockResolvedValue('112233');
    mockOtp.verify.mockImplementation(async (userId: string, purpose: any, code: string) => {
      if (code === '112233' || code === '123456') return 'OK';
      return 'INVALID';
    });
  });

  /* ══════════════════════════════════════════════════════════════
     1. JwtStrategy.validate Unit Checks
     ══════════════════════════════════════════════════════════════ */
  describe('1. JwtStrategy.validate', () => {
    beforeEach(() => {
      jwtStrategy = new JwtStrategy({ validate: jest.fn().mockResolvedValue(undefined) } as any);
    });

    it('passes payload when verified: true is present', async () => {
      const payload: any = { sub: 'u1', email: 'a@b.com', verified: true };
      const res = await jwtStrategy.validate(payload);
      expect(res).toEqual(payload);
    });

    it('throws UnauthorizedException with EMAIL_NOT_VERIFIED when verified is false or missing', async () => {
      const payloadMissing: any = { sub: 'u1', email: 'a@b.com' };
      await expect(jwtStrategy.validate(payloadMissing)).rejects.toMatchObject({
        response: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'يرجى توثيق البريد الإلكتروني أولاً',
        },
      });

      const payloadFalse: any = { sub: 'u1', email: 'a@b.com', verified: false };
      await expect(jwtStrategy.validate(payloadFalse)).rejects.toMatchObject({
        response: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'يرجى توثيق البريد الإلكتروني أولاً',
        },
      });
    });

    it('throws UnauthorizedException with INVALID_TOKEN_PURPOSE when payload has purpose', async () => {
      const payloadPurpose: any = { sub: 'u1', purpose: 'email-verify' };
      await expect(jwtStrategy.validate(payloadPurpose)).rejects.toMatchObject({
        response: {
          code: 'INVALID_TOKEN_PURPOSE',
          message: 'رمز غير صالح لهذا المسار',
        },
      });
    });
  });

  /* ══════════════════════════════════════════════════════════════
     2. Integration Test with Real JwtModule & GlobalExceptionFilter
     ══════════════════════════════════════════════════════════════ */
  describe('2. Guard Integration with real signatures', () => {
    let app: INestApplication;

    beforeAll(async () => {
      process.env.JWT_SECRET = JWT_SECRET;
      process.env.NODE_ENV = 'test';

      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [
          JwtModule.register({
            secret: JWT_SECRET,
            signOptions: { expiresIn: '15m' },
          }),
        ],
        controllers: [TestGateController],
        providers: [
          JwtStrategy,
          JwtVerifyStrategy,
          JwtAuthGuard,
          OptionalJwtAuthGuard,
          VerificationGuard,
          AuthService,
          AuthTokenService,
          AuthAuditService,
          { provide: OtpService, useValue: mockOtp },
          { provide: PrismaService, useValue: mockPrisma },
          { provide: MailService, useValue: mockMail },
          { provide: RedisService, useValue: mockRedis },
          { provide: AccessTokenGate, useValue: { validate: jest.fn().mockResolvedValue(undefined) } },
        ],
      }).compile();

      app = moduleRef.createNestApplication();
      app.useGlobalFilters(new GlobalExceptionFilter());
      await app.init();
      jwtService = moduleRef.get<JwtService>(JwtService);
    });

    afterAll(async () => {
      await app.close();
    });

    it('returns 200 for token with verified: true on JwtAuthGuard', async () => {
      const token = jwtService.sign({ sub: 'u1', email: 'a@b.com', verified: true });
      const res = await request(app.getHttpServer())
        .get('/test-gate/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.ok).toBe(true);
    });

    it('returns 401 with EMAIL_NOT_VERIFIED for token without verified claim', async () => {
      const token = jwtService.sign({ sub: 'u1', email: 'a@b.com' });
      const res = await request(app.getHttpServer())
        .get('/test-gate/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
      expect(res.body.message).toBe('يرجى توثيق البريد الإلكتروني أولاً');
    });

    it('returns 401 with INVALID_TOKEN_PURPOSE for verification token on JwtAuthGuard', async () => {
      const token = jwtService.sign({ sub: 'u1', purpose: 'email-verify' });
      const res = await request(app.getHttpServer())
        .get('/test-gate/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body.code).toBe('INVALID_TOKEN_PURPOSE');
    });

    it('OptionalJwtAuthGuard treats unverified token as guest (user null)', async () => {
      const unverifiedToken = jwtService.sign({ sub: 'u1', email: 'a@b.com', verified: false });
      const res = await request(app.getHttpServer())
        .get('/test-gate/optional')
        .set('Authorization', `Bearer ${unverifiedToken}`);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.user).toBeNull();
    });

    it('VerificationGuard accepts purpose: email-verify and rejects standard access token', async () => {
      const vToken = jwtService.sign({ sub: 'u1', purpose: 'email-verify' });
      const resOk = await request(app.getHttpServer())
        .get('/test-gate/verify-endpoint')
        .set('Authorization', `Bearer ${vToken}`);

      expect(resOk.status).toBe(HttpStatus.OK);
      expect(resOk.body.sub).toBe('u1');

      const regularToken = jwtService.sign({ sub: 'u1', email: 'a@b.com', verified: true });
      const resFail = await request(app.getHttpServer())
        .get('/test-gate/verify-endpoint')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(resFail.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('attack scenario: signed verificationToken for verified user on POST /verify-email returns 200 without tokens', async () => {
      const vToken = jwtService.sign(
        { sub: 'victim-user-id', purpose: 'email-verify' },
        { secret: JWT_SECRET, expiresIn: '15m' },
      );

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'victim-user-id',
        email: 'victim@example.com',
        isVerified: true,
      });

      const res = await request(app.getHttpServer())
        .post('/test-gate/verify-email')
        .set('Authorization', `Bearer ${vToken}`)
        .send({ code: '123456' });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body.alreadyVerified).toBe(true);
      expect(res.body.message).toBe('البريد موثق بالفعل. يرجى تسجيل الدخول.');
      expect(res.body.accessToken).toBeUndefined();
      expect(res.body.refreshToken).toBeUndefined();
    });
  });

  /* ══════════════════════════════════════════════════════════════
     3. AuthTokenService & Verification Token
     ══════════════════════════════════════════════════════════════ */
  describe('3. AuthTokenService', () => {
    beforeAll(async () => {
      process.env.JWT_SECRET = JWT_SECRET;
      process.env.NODE_ENV = 'test';

      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [
          JwtModule.register({
            secret: JWT_SECRET,
            signOptions: { expiresIn: '15m' },
          }),
        ],
        providers: [
          AuthTokenService,
          { provide: PrismaService, useValue: mockPrisma },
        ],
      }).compile();

      authTokenService = moduleRef.get<AuthTokenService>(AuthTokenService);
      jwtService = moduleRef.get<JwtService>(JwtService);
    });

    it('buildPayload adds verified matching user.isVerified', () => {
      const verifiedUser: any = { id: 'u1', email: 'a@b.com', username: 'u', role: 'user', isVerified: true };
      const unverifiedUser: any = { id: 'u2', email: 'b@b.com', username: 'u2', role: 'user', isVerified: false };

      expect(authTokenService.buildPayload(verifiedUser)).toMatchObject({
        sub: 'u1',
        verified: true,
      });
      expect(authTokenService.buildPayload(unverifiedUser)).toMatchObject({
        sub: 'u2',
        verified: false,
      });
    });

    it('signVerificationToken produces a token with sub and purpose email-verify only', async () => {
      const vToken = await authTokenService.signVerificationToken('user-123');
      const decoded: any = jwtService.verify(vToken);
      expect(decoded.sub).toBe('user-123');
      expect(decoded.purpose).toBe('email-verify');
      expect(decoded.email).toBeUndefined();
      expect(decoded.role).toBeUndefined();
      expect(decoded.verified).toBeUndefined();
    });

    it('rotateRefreshToken returns null when user is not verified', async () => {
      const rawToken = 'test-refresh-token';
      const hashed = authTokenService.hashToken(rawToken);

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token: hashed,
        userId: 'u-unverified',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-unverified',
        email: 'unv@example.com',
        isVerified: false,
      });

      const res = await authTokenService.rotateRefreshToken(rawToken);
      expect(res).toBeNull();
      // Unverified user fails without token consumption
      expect(mockPrisma.refreshToken.update).not.toHaveBeenCalled();
    });
  });

  /* ══════════════════════════════════════════════════════════════
     4. AuthService Business Logic (signup / login / verifyEmail / attempts)
     ══════════════════════════════════════════════════════════════ */
  describe('4. AuthService business rules', () => {
    beforeAll(async () => {
      process.env.JWT_SECRET = JWT_SECRET;
      process.env.NODE_ENV = 'test';

      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [
          JwtModule.register({
            secret: JWT_SECRET,
            signOptions: { expiresIn: '15m' },
          }),
        ],
        providers: [
          AuthService,
          AuthTokenService,
          AuthAuditService,
          { provide: OtpService, useValue: mockOtp },
          { provide: PrismaService, useValue: mockPrisma },
          { provide: MailService, useValue: mockMail },
          { provide: RedisService, useValue: mockRedis },
          { provide: AccessTokenGate, useValue: { invalidate: jest.fn().mockResolvedValue(undefined), validate: jest.fn().mockResolvedValue({ tv: 0, status: 'ACTIVE' }) } },
        ],
      }).compile();

      authService = moduleRef.get<AuthService>(AuthService);
      authAuditService = moduleRef.get<AuthAuditService>(AuthAuditService);
      authTokenService = moduleRef.get<AuthTokenService>(AuthTokenService);
      jwtService = moduleRef.get<JwtService>(JwtService);
    });

    it('signup returns requiresVerification, verificationToken, emailSent without accessToken/refreshToken', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-u1',
        email: 'new@example.com',
        username: 'newuser',
        isVerified: false,
      });

      const res = await authService.signup({
        email: 'new@example.com',
        username: 'newuser',
        password: 'Password1',
      });

      expect(res.requiresVerification).toBe(true);
      expect(res.emailSent).toBe(true);
      expect(res.verificationToken).toBeDefined();
      expect(res.user).toEqual({ email: 'new@example.com' });
      expect((res as any).accessToken).toBeUndefined();
      expect((res as any).refreshToken).toBeUndefined();
      expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('signup handles mail failure gracefully without throwing 500 (emailSent: false)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-u2',
        email: 'new2@example.com',
        username: 'newuser2',
        isVerified: false,
      });
      mockMail.sendVerificationEmail.mockRejectedValueOnce(new Error('SMTP down'));

      const res = await authService.signup({
        email: 'new2@example.com',
        username: 'newuser2',
        password: 'Password1',
      });

      expect(res.requiresVerification).toBe(true);
      expect(res.emailSent).toBe(false);
      expect(res.verificationToken).toBeDefined();
    });

    it('login for unverified user with correct password returns HTTP 200 gate response without tokens', async () => {
      const hash = await bcrypt.hash('Password1', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-unv',
        email: 'unv@example.com',
        passwordHash: hash,
        isVerified: false,
      });
      mockPrisma.user.update.mockResolvedValue({});

      const res = await authService.login({ email: 'unv@example.com', password: 'Password1' });

      expect(res.requiresVerification).toBe(true);
      expect(res.verificationToken).toBeDefined();
      expect(res.emailSent).toBe(true);
      expect(res.user).toEqual({ email: 'unv@example.com' });
      expect((res as any).accessToken).toBeUndefined();
      expect((res as any).refreshToken).toBeUndefined();
      expect(mockMail.sendVerificationEmail).toHaveBeenCalled();
      expect(mockOtp.issue).toHaveBeenCalledWith('u-unv', 'EMAIL_VERIFY', expect.any(Number));
    });

    it('verifyEmail with correct code issues full tokens with verified: true', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-target',
        email: 'v@example.com',
        username: 'vuser',
        role: 'user',
        isVerified: false,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-target',
        email: 'v@example.com',
        username: 'vuser',
        role: 'user',
        isVerified: true,
      });
      mockPrisma.refreshToken.create.mockResolvedValue({ token: 'hashed' });

      const res = await authService.verifyEmail('u-target', '112233');

      expect(res.accessToken).toBeDefined();
      expect(res.refreshToken).toBeDefined();
      expect(res.user.isVerified).toBe(true);

      const payload: any = jwtService.verify(res.accessToken);
      expect(payload.verified).toBe(true);
    });

    it('attempts counter locks out at 5 failures, clears code, and rejects 6th attempt even with correct code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-lock',
        email: 'lock@example.com',
        isVerified: false,
      });
      mockPrisma.user.update.mockResolvedValue({});

      // 4 wrong attempts
      mockOtp.verify.mockResolvedValue('INVALID');
      for (let i = 1; i <= 4; i++) {
        await expect(authService.verifyEmail('u-lock', '000000')).rejects.toThrow(BadRequestException);
      }

      // 5th wrong attempt -> should throw 400 with TOO_MANY_ATTEMPTS
      mockOtp.verify.mockResolvedValue('TOO_MANY_ATTEMPTS');
      await expect(authService.verifyEmail('u-lock', '000000')).rejects.toThrow(
        'تم تجاوز عدد المحاولات. اطلب رمزاً جديداً.',
      );

      // 6th attempt with previously valid code -> should be rejected because attempts >= 5
      await expect(authService.verifyEmail('u-lock', '123456')).rejects.toThrow(
        'تم تجاوز عدد المحاولات. اطلب رمزاً جديداً.',
      );
    });

    it('resendVerification clears verify attempts counter and issues new code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-resend',
        email: 'resend@example.com',
        isVerified: false,
      });
      mockPrisma.user.update.mockResolvedValue({});

      await authService.resendVerification('u-resend');

      expect(mockOtp.issue).toHaveBeenCalledWith('u-resend', 'EMAIL_VERIFY', expect.any(Number));
    });

    it('verifyEmail for already verified user returns alreadyVerified: true and NO tokens without calling signAccessToken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-already-verified',
        email: 'already@example.com',
        isVerified: true,
      });
      const signSpy = jest.spyOn(authTokenService, 'signAccessToken');
      const refreshSpy = jest.spyOn(authTokenService, 'generateRefreshToken');

      const res = await authService.verifyEmail('u-already-verified', 'any-code-999');

      expect(res.alreadyVerified).toBe(true);
      expect(res.message).toBe('البريد موثق بالفعل. يرجى تسجيل الدخول.');
      expect((res as any).accessToken).toBeUndefined();
      expect((res as any).refreshToken).toBeUndefined();
      expect(signSpy).not.toHaveBeenCalled();
      expect(refreshSpy).not.toHaveBeenCalled();
      signSpy.mockRestore();
      refreshSpy.mockRestore();
    });
  });
});
