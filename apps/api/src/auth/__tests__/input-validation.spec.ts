import { ValidationPipe, BadRequestException, NotFoundException } from '@nestjs/common';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { SignupDto } from '../dto/signup.dto';
import { ChangePasswordDto } from '../../users/dto/change-password.dto';
import { UpdateProfileDto } from '../../users/dto/update-profile.dto';
import { AuthTokenService } from '../auth-token.service';
import { AuthService } from '../auth.service';
import { AuthAuditService } from '../auth-audit.service';
import { normalizeDigits } from '../auth.validators';

describe('Auth & Input Validation Suite', () => {
  let pipe: ValidationPipe;
  let tokenService: AuthTokenService;

  beforeEach(() => {
    pipe = new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    });
    tokenService = new AuthTokenService({} as any, {} as any);
  });

  describe('1. normalizeDigits utility', () => {
    it('converts Arabic-Indic (٠-٩) and Persian (۰-۹) digits to ASCII', () => {
      expect(normalizeDigits('١٢٣٤٥٦')).toBe('123456');
      expect(normalizeDigits('۱۲۳۴۵۶')).toBe('123456');
      expect(normalizeDigits('  ١٢٣\u200F٤٥٦  ')).toBe('123456');
      expect(normalizeDigits(null)).toBe('');
      expect(normalizeDigits(undefined)).toBe('');
      expect(normalizeDigits(123456 as any)).toBe('');
    });
  });

  describe('2. Verification Code Validation (VerifyEmailDto & ResetPasswordDto)', () => {
    it('VerifyEmailDto converts Arabic-Indic digits to ASCII and succeeds', async () => {
      const result = await pipe.transform(
        { code: '١٢٣٤٥٦' },
        { type: 'body', metatype: VerifyEmailDto },
      );
      expect(result.code).toBe('123456');
    });

    it('VerifyEmailDto converts Persian digits to ASCII and succeeds', async () => {
      const result = await pipe.transform(
        { code: '۱۲۳۴۵۶' },
        { type: 'body', metatype: VerifyEmailDto },
      );
      expect(result.code).toBe('123456');
    });

    it('VerifyEmailDto rejects code with characters or length != 6 with standard Arabic message', async () => {
      const invalidCodes = ['12345', '1234567', '12345a', 'abcdef'];
      for (const code of invalidCodes) {
        await expect(
          pipe.transform({ code }, { type: 'body', metatype: VerifyEmailDto }),
        ).rejects.toThrow(BadRequestException);

        try {
          await pipe.transform({ code }, { type: 'body', metatype: VerifyEmailDto });
        } catch (err: any) {
          const res = err.getResponse();
          const messages = Array.isArray(res.message) ? res.message : [res.message];
          expect(messages).toContain('رمز التحقق يجب أن يكون 6 أرقام');
        }
      }
    });

    it('ResetPasswordDto converts Arabic-Indic code and validates', async () => {
      const result = await pipe.transform(
        {
          email: 'valid@example.com',
          code: '١٢٣٤٥٦',
          newPassword: 'Password1',
        },
        { type: 'body', metatype: ResetPasswordDto },
      );
      expect(result.code).toBe('123456');
    });

    it('ResetPasswordDto rejects code with letters or wrong length', async () => {
      await expect(
        pipe.transform(
          {
            email: 'valid@example.com',
            code: '١٢٣٤٥',
            newPassword: 'Password1',
          },
          { type: 'body', metatype: ResetPasswordDto },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. safeCompare byte-length safety', () => {
    it('returns false without throwing when char length is same but byte length differs', () => {
      // "123456" is 6 chars, 6 bytes. "١٢٣٤٥٦" is 6 chars, 12 bytes.
      expect(() => tokenService.safeCompare('123456', '١٢٣٤٥٦')).not.toThrow();
      expect(tokenService.safeCompare('123456', '١٢٣٤٥٦')).toBe(false);
    });

    it('returns true when values are identical', () => {
      expect(tokenService.safeCompare('123456', '123456')).toBe(true);
      expect(tokenService.safeCompare('secret_token', 'secret_token')).toBe(true);
    });

    it('returns false when values differ but have same length', () => {
      expect(tokenService.safeCompare('123456', '654321')).toBe(false);
    });

    it('returns false safely without throwing for non-string inputs', () => {
      expect(tokenService.safeCompare(null as any, '123456')).toBe(false);
      expect(tokenService.safeCompare('123456', undefined as any)).toBe(false);
      expect(tokenService.safeCompare(123456 as any, 123456 as any)).toBe(false);
    });
  });

  describe('4. AuthService verifyEmail & resetPassword with Arabic digits through Pipe', () => {
    let authService: AuthService;
    let mockPrisma: any;
    let mockMailService: any;
    let mockTokens: any;
    let mockAuditService: any;

    beforeEach(() => {
      mockPrisma = {
        user: {
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
        refreshToken: {
          create: jest.fn().mockResolvedValue({ token: 'mock-ref' }),
        },
        $transaction: jest.fn().mockImplementation(async (cb: any) => {
          if (typeof cb === 'function') return cb(mockPrisma);
          return Promise.all(cb);
        }),
      };
      mockMailService = {
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      };
      mockTokens = {
        safeCompare: (a: string, b: string) => tokenService.safeCompare(a, b),
        signAccessToken: jest.fn().mockResolvedValue('acc-token'),
        generateRefreshToken: jest.fn().mockResolvedValue('ref-token'),
        sanitizeUser: jest.fn().mockImplementation((u) => u),
        revokeAllRefreshTokens: jest.fn().mockResolvedValue(undefined),
      };
      mockAuditService = {
        recordLoginSuccess: jest.fn().mockResolvedValue(undefined),
        recordLoginFailure: jest.fn().mockResolvedValue(undefined),
        getVerifyAttempts: jest.fn().mockResolvedValue(0),
        recordVerifyFailure: jest.fn().mockResolvedValue(1),
        clearVerifyAttempts: jest.fn().mockResolvedValue(undefined),
      };

      authService = new AuthService(
        mockPrisma,
        mockMailService,
        mockTokens,
        mockAuditService,
      );
    });

    it('verifyEmail succeeds when user submits Arabic-Indic digits via pipe', async () => {
      const dto = await pipe.transform(
        { code: '١٢٣٤٥٦' },
        { type: 'body', metatype: VerifyEmailDto },
      );

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        emailVerificationCode: '123456',
        emailVerificationExpiry: new Date(Date.now() + 600000),
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        isVerified: true,
      });

      const result = await authService.verifyEmail('user-1', dto.code);
      expect(result).toEqual({
        accessToken: 'acc-token',
        refreshToken: 'ref-token',
        user: expect.objectContaining({ isVerified: true }),
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          isVerified: true,
          emailVerificationCode: null,
          emailVerificationExpiry: null,
        },
      });
    });

    it('resetPassword succeeds when user submits Arabic-Indic digits via pipe', async () => {
      const dto = await pipe.transform(
        {
          email: 'user@example.com',
          code: '١٢٣٤٥٦',
          newPassword: 'NewPassword1',
        },
        { type: 'body', metatype: ResetPasswordDto },
      );

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordResetCode: '123456',
        passwordResetExpiry: new Date(Date.now() + 600000),
      });
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await authService.resetPassword(dto.email, dto.code, dto.newPassword);
      expect(result).toEqual({ message: 'تم تغيير كلمة المرور بنجاح' });
    });
  });

  describe('5. Username Rules in SignupDto', () => {
    it('lowercases and trims username: Mahmoud_99 -> mahmoud_99', async () => {
      const result = await pipe.transform(
        {
          email: 'valid@example.com',
          username: '  Mahmoud_99  ',
          password: 'Password1',
        },
        { type: 'body', metatype: SignupDto },
      );
      expect(result.username).toBe('mahmoud_99');
    });

    it('allows dot in username: a.b_c', async () => {
      const result = await pipe.transform(
        {
          email: 'valid@example.com',
          username: 'a.b_c',
          password: 'Password1',
        },
        { type: 'body', metatype: SignupDto },
      );
      expect(result.username).toBe('a.b_c');
    });

    it('rejects Arabic characters in username: محمود', async () => {
      await expect(
        pipe.transform(
          { email: 'valid@example.com', username: 'محمود', password: 'Password1' },
          { type: 'body', metatype: SignupDto },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects username shorter than 3 chars: ab', async () => {
      await expect(
        pipe.transform(
          { email: 'valid@example.com', username: 'ab', password: 'Password1' },
          { type: 'body', metatype: SignupDto },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects username longer than 30 chars', async () => {
      await expect(
        pipe.transform(
          { email: 'valid@example.com', username: 'a'.repeat(31), password: 'Password1' },
          { type: 'body', metatype: SignupDto },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects username with spaces', async () => {
      await expect(
        pipe.transform(
          { email: 'valid@example.com', username: 'user name', password: 'Password1' },
          { type: 'body', metatype: SignupDto },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects reserved usernames case-insensitively with standard Arabic message', async () => {
      const reserved = ['admin', 'ADMIN', 'Support', 'souqone', 'root', 'moderator', 'system', 'administrator'];
      for (const username of reserved) {
        try {
          await pipe.transform(
            { email: 'valid@example.com', username, password: 'Password1' },
            { type: 'body', metatype: SignupDto },
          );
          fail(`Should have thrown for reserved username: ${username}`);
        } catch (err: any) {
          expect(err).toBeInstanceOf(BadRequestException);
          const res = err.getResponse();
          const messages = Array.isArray(res.message) ? res.message : [res.message];
          expect(messages).toContain('اسم المستخدم غير متاح');
        }
      }
    });
  });

  describe('6. Duplicate Username in AuthService signup', () => {
    let authService: AuthService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        user: {
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          create: jest.fn(),
        },
        refreshToken: {
          create: jest.fn().mockResolvedValue({ token: 'mock-ref' }),
        },
      };
      const mockMail = { sendVerificationEmail: jest.fn() };
      const mockTokens = {
        generateVerificationCode: jest.fn().mockReturnValue('123456'),
        signAccessToken: jest.fn().mockResolvedValue('acc'),
        generateRefreshToken: jest.fn().mockResolvedValue('ref'),
        sanitizeUser: (u: any) => u,
      };
      const mockAudit = { recordLoginSuccess: jest.fn() };

      authService = new AuthService(
        mockPrisma,
        mockMail as any,
        mockTokens as any,
        mockAudit as any,
      );
    });

    it('rejects duplicate username case-insensitively and does NOT call user.create', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null); // email not taken
      // Existing user has lowercase "mahmoud"
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'existing-id' });

      await expect(
        authService.signup({
          email: 'new@example.com',
          username: 'Mahmoud',
          password: 'Password1',
        }),
      ).rejects.toThrow(new BadRequestException('اسم المستخدم مستخدم بالفعل'));

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          username: {
            equals: 'mahmoud',
            mode: 'insensitive',
          },
        },
        select: { id: true },
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('7. DisplayName Rules in SignupDto & UpdateProfileDto', () => {
    it('rejects displayName shorter than 2 chars', async () => {
      await expect(
        pipe.transform(
          {
            email: 'valid@example.com',
            username: 'user123',
            password: 'Password1',
            displayName: 'A',
          },
          { type: 'body', metatype: SignupDto },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('strips U+200F and trims displayName', async () => {
      const result = await pipe.transform(
        {
          email: 'valid@example.com',
          username: 'user123',
          password: 'Password1',
          displayName: '  علي\u200F  ',
        },
        { type: 'body', metatype: SignupDto },
      );
      expect(result.displayName).toBe('علي');
    });

    it('rejects displayName containing < or >', async () => {
      const invalid = ['<script>', 'Ali > Bob', 'Hello<World'];
      for (const displayName of invalid) {
        await expect(
          pipe.transform(
            {
              email: 'valid@example.com',
              username: 'user123',
              password: 'Password1',
              displayName,
            },
            { type: 'body', metatype: SignupDto },
          ),
        ).rejects.toThrow(BadRequestException);
      }
    });

    it('rejects displayName longer than 50 chars', async () => {
      await expect(
        pipe.transform(
          {
            email: 'valid@example.com',
            username: 'user123',
            password: 'Password1',
            displayName: 'a'.repeat(51),
          },
          { type: 'body', metatype: SignupDto },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('passes when displayName is omitted (optional)', async () => {
      const result = await pipe.transform(
        {
          email: 'valid@example.com',
          username: 'user123',
          password: 'Password1',
        },
        { type: 'body', metatype: SignupDto },
      );
      expect(result.displayName).toBeUndefined();
    });

    it('enforces same rules on UpdateProfileDto', async () => {
      await expect(
        pipe.transform({ displayName: 'A' }, { type: 'body', metatype: UpdateProfileDto }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        pipe.transform({ displayName: '<b>Name</b>' }, { type: 'body', metatype: UpdateProfileDto }),
      ).rejects.toThrow(BadRequestException);

      const stripped = await pipe.transform(
        { displayName: '  محمد\u200E  ' },
        { type: 'body', metatype: UpdateProfileDto },
      );
      expect(stripped.displayName).toBe('محمد');
    });
  });

  describe('8. Password Byte-Length Validation (72 bytes bcrypt limit)', () => {
    it('accepts password of exactly 72 UTF-8 bytes', async () => {
      // 70 ASCII chars + "A1" = 72 bytes
      const valid72 = 'A1' + 'a'.repeat(70);
      expect(Buffer.byteLength(valid72, 'utf8')).toBe(72);

      const result = await pipe.transform(
        {
          email: 'valid@example.com',
          username: 'user123',
          password: valid72,
        },
        { type: 'body', metatype: SignupDto },
      );
      expect(result.password).toBe(valid72);
    });

    it('rejects password of 73 UTF-8 bytes with message "كلمة المرور طويلة جداً"', async () => {
      const invalid73 = 'A1' + 'a'.repeat(71);
      expect(Buffer.byteLength(invalid73, 'utf8')).toBe(73);

      try {
        await pipe.transform(
          {
            email: 'valid@example.com',
            username: 'user123',
            password: invalid73,
          },
          { type: 'body', metatype: SignupDto },
        );
        fail('Should have thrown for 73 bytes password');
      } catch (err: any) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = err.getResponse();
        const messages = Array.isArray(res.message) ? res.message : [res.message];
        expect(messages).toContain('كلمة المرور طويلة جداً');
      }
    });

    it('rejects long Arabic password (> 72 bytes) even if char count is <= 72', async () => {
      // Arabic chars take 2 bytes each in UTF-8. 37 Arabic characters = 74 bytes.
      // Include A and 1 to satisfy regex requirements.
      const longArabicPass = 'A1' + 'كلمةمرورطويلةجداًجداًجداًجداًجداًجداً';
      expect(Buffer.byteLength(longArabicPass, 'utf8')).toBeGreaterThan(72);

      await expect(
        pipe.transform(
          {
            email: 'valid@example.com',
            username: 'user123',
            password: longArabicPass,
          },
          { type: 'body', metatype: SignupDto },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('enforces 72 bytes limit on ResetPasswordDto.newPassword', async () => {
      const invalid73 = 'A1' + 'a'.repeat(71);
      await expect(
        pipe.transform(
          {
            email: 'valid@example.com',
            code: '123456',
            newPassword: invalid73,
          },
          { type: 'body', metatype: ResetPasswordDto },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('enforces 72 bytes limit on ChangePasswordDto.newPassword', async () => {
      const invalid73 = 'A1' + 'a'.repeat(71);
      await expect(
        pipe.transform(
          {
            currentPassword: 'OldPassword1',
            newPassword: invalid73,
          },
          { type: 'body', metatype: ChangePasswordDto },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('still rejects passwords failing existing complexity rules (<8 chars, missing uppercase, missing digit)', async () => {
      const cases = ['Short1', 'nouppercase1', 'NoDigitsHere'];
      for (const password of cases) {
        await expect(
          pipe.transform(
            { email: 'valid@example.com', username: 'user123', password },
            { type: 'body', metatype: SignupDto },
          ),
        ).rejects.toThrow(BadRequestException);
      }
    });
  });
});
