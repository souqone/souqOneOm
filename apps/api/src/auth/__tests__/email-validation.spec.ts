import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { normalizeEmail, isValidNormalizedEmail } from '../auth.validators';
import { AuthService } from '../auth.service';
import { AuthAuditService } from '../auth-audit.service';

describe('AUTH-4A-1 Email Normalization & Validation', () => {
  const hiddenChars = [
    { code: 'U+200E', char: '\u200E', name: 'Left-to-Right Mark' },
    { code: 'U+200F', char: '\u200F', name: 'Right-to-Left Mark' },
    { code: 'U+202A', char: '\u202A', name: 'Left-to-Right Embedding' },
    { code: 'U+202B', char: '\u202B', name: 'Right-to-Left Embedding' },
    { code: 'U+202C', char: '\u202C', name: 'Pop Directional Formatting' },
    { code: 'U+202D', char: '\u202D', name: 'Left-to-Right Override' },
    { code: 'U+202E', char: '\u202E', name: 'Right-to-Left Override' },
    { code: 'U+2066', char: '\u2066', name: 'Left-to-Right Isolate' },
    { code: 'U+2067', char: '\u2067', name: 'Right-to-Left Isolate' },
    { code: 'U+2068', char: '\u2068', name: 'First Strong Isolate' },
    { code: 'U+2069', char: '\u2069', name: 'Pop Directional Isolate' },
    { code: 'U+200B', char: '\u200B', name: 'Zero Width Space' },
    { code: 'U+FEFF', char: '\uFEFF', name: 'BOM / ZWNBSP' },
    { code: 'U+00A0', char: '\u00A0', name: 'No-Break Space' },
  ];

  describe('1. normalizeEmail & isValidNormalizedEmail', () => {
    it.each(hiddenChars)(
      'strips hidden char $code ($name) prepended to a@b.com',
      ({ char }) => {
        const input = `${char}a@b.com`;
        expect(normalizeEmail(input)).toBe('a@b.com');
        expect(isValidNormalizedEmail(normalizeEmail(input))).toBe(true);
      },
    );

    it('preserves already clean email', () => {
      expect(normalizeEmail('clean.user@example.com')).toBe('clean.user@example.com');
      expect(isValidNormalizedEmail('clean.user@example.com')).toBe(true);
    });

    it('converts uppercase email to lowercase', () => {
      expect(normalizeEmail('USER.Name+tag@EXAMPLE.COM')).toBe('user.name+tag@example.com');
      expect(isValidNormalizedEmail('user.name+tag@example.com')).toBe(true);
    });

    it('rejects email longer than 254 characters', () => {
      const longLocal = 'a'.repeat(250);
      const longEmail = `${longLocal}@example.com`; // 262 chars
      expect(longEmail.length).toBeGreaterThan(254);
      const normalized = normalizeEmail(longEmail);
      expect(isValidNormalizedEmail(normalized)).toBe(false);
    });

    it('rejects email containing non-ASCII characters after normalization', () => {
      const arabicEmail = 'مستخدم@souqone.om';
      const normalized = normalizeEmail(arabicEmail);
      expect(isValidNormalizedEmail(normalized)).toBe(false);
    });

    it('rejects invalid email formats', () => {
      expect(isValidNormalizedEmail(normalizeEmail('plainaddress'))).toBe(false);
      expect(isValidNormalizedEmail(normalizeEmail('@missingusername.com'))).toBe(false);
      expect(isValidNormalizedEmail(normalizeEmail('user@.com'))).toBe(false);
    });
  });

  describe('2. ValidationPipe & DTO Integration', () => {
    let pipe: ValidationPipe;

    beforeEach(() => {
      pipe = new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      });
    });

    it('transforms and validates SignupDto with U+200F email', async () => {
      const dto = await pipe.transform(
        {
          email: '\u200Fuser@example.com',
          username: 'validuser',
          password: 'Password123!',
          displayName: 'Test User',
          phone: '91234567',
        },
        { type: 'body', metatype: SignupDto },
      );
      expect(dto.email).toBe('user@example.com');
    });

    it('transforms and validates LoginDto with U+200F email', async () => {
      const dto = await pipe.transform(
        {
          email: '\u200Fuser@example.com',
          password: 'Password123!',
        },
        { type: 'body', metatype: LoginDto },
      );
      expect(dto.email).toBe('user@example.com');
    });

    it('transforms and validates ForgotPasswordDto with U+200F email', async () => {
      const dto = await pipe.transform(
        {
          email: '\u200Fuser@example.com',
        },
        { type: 'body', metatype: ForgotPasswordDto },
      );
      expect(dto.email).toBe('user@example.com');
    });

    it('transforms and validates ResetPasswordDto with U+200F email', async () => {
      const dto = await pipe.transform(
        {
          email: '\u200Fuser@example.com',
          code: '123456',
          newPassword: 'Password123!',
        },
        { type: 'body', metatype: ResetPasswordDto },
      );
      expect(dto.email).toBe('user@example.com');
    });

    it('rejects invalid email in SignupDto with standard 400 message', async () => {
      await expect(
        pipe.transform(
          {
            email: 'not-an-email',
            username: 'validuser',
            password: 'Password123!',
          },
          { type: 'body', metatype: SignupDto },
        ),
      ).rejects.toThrow(BadRequestException);

      try {
        await pipe.transform(
          {
            email: 'مستخدم@example.com',
            username: 'validuser',
            password: 'Password123!',
          },
          { type: 'body', metatype: SignupDto },
        );
      } catch (err: any) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = err.getResponse();
        expect(JSON.stringify(res)).toContain('البريد الإلكتروني غير صالح');
      }
    });
  });

  describe('3. AuthService & Audit Integration', () => {
    let authService: AuthService;
    let auditService: AuthAuditService;
    let mockPrisma: any;
    let mockMailService: any;
    let mockTokens: any;
    let mockRedis: any;

    beforeEach(() => {
      const redisStore = new Map<string, { value: any; ttlSeconds: number }>();
      mockRedis = {
        get: jest.fn().mockImplementation(async (key: string) => {
          const entry = redisStore.get(key);
          return entry !== undefined ? entry.value : null;
        }),
        set: jest.fn().mockImplementation(async (key: string, value: any, ttl?: number) => {
          redisStore.set(key, { value, ttlSeconds: ttl ?? -1 });
        }),
        del: jest.fn().mockImplementation(async (key: string) => {
          redisStore.delete(key);
        }),
        incr: jest.fn().mockImplementation(async (key: string, ttlSeconds?: number) => {
          const entry = redisStore.get(key);
          const current = entry ? Number(entry.value) : 0;
          const next = current + 1;
          const ttl = entry ? entry.ttlSeconds : (ttlSeconds ?? -1);
          redisStore.set(key, { value: next, ttlSeconds: ttl });
          return next;
        }),
        expire: jest.fn().mockImplementation(async (key: string, seconds: number) => {
          const entry = redisStore.get(key);
          if (entry) {
            entry.ttlSeconds = seconds;
          }
        }),
        getTTL: jest.fn().mockImplementation(async (key: string) => {
          const entry = redisStore.get(key);
          return entry ? entry.ttlSeconds : -2;
        }),
        trySetNX: jest.fn().mockImplementation(async (key: string, value: string, ttlSeconds: number) => {
          if (redisStore.has(key)) return 'exists';
          redisStore.set(key, { value, ttlSeconds });
          return 'acquired';
        }),
      };

      mockPrisma = {
        user: {
          findUnique: jest.fn(),
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
          update: jest.fn(),
        },
        loginAudit: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      auditService = new AuthAuditService(mockPrisma as any, mockRedis as any);

      mockMailService = {
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      };

      mockTokens = {
        generateVerificationCode: jest.fn().mockReturnValue('123456'),
        signVerificationToken: jest.fn().mockResolvedValue('v-token'),
        signAccessToken: jest.fn().mockResolvedValue('acc-token'),
        generateRefreshToken: jest.fn().mockResolvedValue('ref-token'),
        sanitizeUser: jest.fn().mockImplementation((u) => u),
        safeCompare: jest.fn().mockReturnValue(true),
      };

      const mockOtp = {
        issue: jest.fn().mockResolvedValue('123456'),
        verify: jest.fn().mockResolvedValue('OK'),
        invalidateActive: jest.fn().mockResolvedValue(undefined),
      };

      const mockAccessTokenGate = {
        invalidate: jest.fn().mockResolvedValue(undefined),
        validate: jest.fn().mockResolvedValue({ tv: 0, status: 'ACTIVE' }),
      };

      const mockAccountStatusService = {
        assertCanAuthenticate: jest.fn().mockResolvedValue(undefined),
      };

      const mockBanBlacklistService = {
        isGoogleBlocked: jest.fn().mockResolvedValue(false),
        isPhoneBlocked: jest.fn().mockResolvedValue(false),
        addForUser: jest.fn().mockResolvedValue(0),
        removeForUser: jest.fn().mockResolvedValue(0),
      };

      authService = new AuthService(
        mockPrisma as any,
        mockMailService as any,
        mockTokens as any,
        auditService,
        mockOtp as any,
        mockAccessTokenGate as any,
        mockAccountStatusService as any,
        mockBanBlacklistService as any,
      );
    });

    it('signup: creates user with normalized email when input contains U+200F', async () => {
      mockPrisma.user.create.mockResolvedValue({
        id: 'u-1',
        email: 'user@example.com',
        username: 'testuser',
      });

      await authService.signup({
        email: '\u200Fuser@example.com',
        username: 'testuser',
        password: 'Password123!',
        displayName: 'Test',
      } as any);

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'user@example.com',
          }),
        }),
      );
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalledWith(
        'user@example.com',
        '123456',
      );
    });

    it('signup: throws 400 when email is invalid and does NOT call prisma.user.create', async () => {
      await expect(
        authService.signup({
          email: 'invalid-email',
          username: 'testuser',
          password: 'Password123!',
          displayName: 'Test',
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockMailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('login: searches with normalized email when input contains U+200F', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: '\u200Fuser@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow();

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
    });

    it('forgotPassword: searches with normalized email when input contains U+200F', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await authService.forgotPassword('\u200Fuser@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
    });

    it('resetPassword: searches with normalized email when input contains U+200F', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.resetPassword('\u200Fuser@example.com', '123456', 'NewPass123!'),
      ).rejects.toThrow();

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
    });

    it('lockout: attempts with U+200F email and clean email share the exact same Redis keys', async () => {
      const dirtyEmail = '\u200Ftarget@example.com';
      const cleanEmail = 'target@example.com';

      // 5 attempts with dirty email
      for (let i = 0; i < 5; i++) {
        await auditService.recordFailedAttempt(dirtyEmail);
      }
      // 5 attempts with clean email
      for (let i = 0; i < 5; i++) {
        await auditService.recordFailedAttempt(cleanEmail);
      }

      // Check lockout on clean email -> should be locked (total 10 attempts reached)
      const lockStatusClean = await auditService.checkLockout(cleanEmail);
      expect(lockStatusClean.locked).toBe(true);

      // Check lockout on dirty email -> should also be locked
      const lockStatusDirty = await auditService.checkLockout(dirtyEmail);
      expect(lockStatusDirty.locked).toBe(true);

      // Reset lockout using dirty email -> clears clean email lock
      await auditService.resetLockout(dirtyEmail);
      const postReset = await auditService.checkLockout(cleanEmail);
      expect(postReset.locked).toBe(false);
    });
  });
});
