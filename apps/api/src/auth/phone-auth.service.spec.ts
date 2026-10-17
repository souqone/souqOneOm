import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AccountStatus, OtpPurpose, UserRole } from '@prisma/client';
import { PhoneAuthService } from './phone-auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { PhoneOtpService } from '../whatsapp/phone-otp.service';
import { AuthTokenService } from './auth-token.service';
import { AuthAuditService } from './auth-audit.service';
import { AccountStatusService } from './account-status.service';
import { BanBlacklistService } from '../ban-blacklist/ban-blacklist.service';

describe('PhoneAuthService', () => {
  let service: PhoneAuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  const mockPhoneOtpService = {
    request: jest.fn(),
    verify: jest.fn(),
  };

  const mockTokens = {
    signAccessToken: jest.fn().mockResolvedValue('jwt-mock-access-token'),
    generateRefreshToken: jest.fn().mockResolvedValue('mock-refresh-token'),
    sanitizeUser: jest.fn((u) => {
      const { passwordHash, ...rest } = u;
      return rest;
    }),
  };

  const mockAudit = {
    logAudit: jest.fn().mockResolvedValue(undefined),
  };

  const mockAccountStatusService = {
    assertCanAuthenticate: jest.fn().mockResolvedValue(undefined),
  };

  const mockBanBlacklistService = {
    isPhoneBlocked: jest.fn().mockResolvedValue(false),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAccountStatusService.assertCanAuthenticate.mockResolvedValue(undefined);
    mockBanBlacklistService.isPhoneBlocked.mockResolvedValue(false);
    mockPrisma.user.create.mockReset();
    mockPrisma.user.findUnique.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhoneAuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PhoneOtpService, useValue: mockPhoneOtpService },
        { provide: AuthTokenService, useValue: mockTokens },
        { provide: AuthAuditService, useValue: mockAudit },
        { provide: AccountStatusService, useValue: mockAccountStatusService },
        { provide: BanBlacklistService, useValue: mockBanBlacklistService },
      ],
    }).compile();

    service = module.get<PhoneAuthService>(PhoneAuthService);
  });

  describe('requestOtp', () => {
    it('successfully requests OTP for valid Oman phone and returns uniform { sent: true }', async () => {
      mockPhoneOtpService.request.mockResolvedValue({
        providerMessageId: 'msg-123',
      });

      const res = await service.requestOtp(
        { phone: '91234567' },
        '192.168.1.1',
      );

      expect(res).toEqual({ sent: true });
      expect(mockPhoneOtpService.request).toHaveBeenCalledWith({
        phoneE164: '+96891234567',
        purpose: OtpPurpose.PHONE_LOGIN,
        ip: '192.168.1.1',
      });
      // Blacklist check must NOT be performed on request (anti-enumeration)
      expect(mockBanBlacklistService.isPhoneBlocked).not.toHaveBeenCalled();
    });

    it('throws 400 PHONE_COUNTRY_NOT_ALLOWED for invalid or unsupported country code', async () => {
      await expect(
        service.requestOtp({ phone: '+12025550199' }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          response: expect.objectContaining({
            code: 'PHONE_COUNTRY_NOT_ALLOWED',
          }),
        }),
      );
      expect(mockPhoneOtpService.request).not.toHaveBeenCalled();
    });

    it('propagates OTP_COOLDOWN 429 directly from PhoneOtpService', async () => {
      mockPhoneOtpService.request.mockRejectedValue(
        new HttpException(
          {
            statusCode: 429,
            code: 'OTP_COOLDOWN',
            message: 'يرجى الانتظار قبل طلب رمز تحقق جديد',
            retryAfterSeconds: 45,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );

      await expect(service.requestOtp({ phone: '91234567' })).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.TOO_MANY_REQUESTS,
          response: expect.objectContaining({ code: 'OTP_COOLDOWN' }),
        }),
      );
    });

    it('propagates OTP_RATE_LIMITED 429 directly from PhoneOtpService', async () => {
      mockPhoneOtpService.request.mockRejectedValue(
        new HttpException(
          {
            statusCode: 429,
            code: 'OTP_RATE_LIMITED',
            message: 'تم تجاوز الحد المسموح لطلب الرموز، يرجى المحاولة لاحقاً',
            retryAfterSeconds: 600,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );

      await expect(service.requestOtp({ phone: '91234567' })).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.TOO_MANY_REQUESTS,
          response: expect.objectContaining({ code: 'OTP_RATE_LIMITED' }),
        }),
      );
    });

    it('propagates OTP_DAILY_CAP_REACHED 429 directly from PhoneOtpService', async () => {
      mockPhoneOtpService.request.mockRejectedValue(
        new HttpException(
          {
            statusCode: 429,
            code: 'OTP_DAILY_CAP_REACHED',
            message: 'تم الوصول إلى الحد الأقصى اليومي لرسائل التحقق',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );

      await expect(service.requestOtp({ phone: '91234567' })).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.TOO_MANY_REQUESTS,
          response: expect.objectContaining({ code: 'OTP_DAILY_CAP_REACHED' }),
        }),
      );
    });

    it('propagates OTP_SEND_FAILED 503 directly from PhoneOtpService', async () => {
      mockPhoneOtpService.request.mockRejectedValue(
        new HttpException(
          {
            statusCode: 503,
            code: 'OTP_SEND_FAILED',
            message: 'تعذر إرسال رمز التحقق عبر واتساب، يرجى المحاولة لاحقاً',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        ),
      );

      await expect(service.requestOtp({ phone: '91234567' })).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.SERVICE_UNAVAILABLE,
          response: expect.objectContaining({ code: 'OTP_SEND_FAILED' }),
        }),
      );
    });
  });

  describe('verifyOtp', () => {
    it('throws 400 PHONE_COUNTRY_NOT_ALLOWED for invalid phone', async () => {
      await expect(
        service.verifyOtp({ phone: 'invalid', code: '123456' }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.BAD_REQUEST,
          response: expect.objectContaining({
            code: 'PHONE_COUNTRY_NOT_ALLOWED',
          }),
        }),
      );
      expect(mockPhoneOtpService.verify).not.toHaveBeenCalled();
    });

    it('existing active user logs in successfully with masked phone in audit log', async () => {
      mockPhoneOtpService.verify.mockResolvedValue({ verified: true });
      const mockUser = {
        id: 'usr_existing_1',
        phone: '+96891234567',
        phoneE164: '+96891234567',
        phoneVerifiedAt: new Date(),
        username: 'user_om_1',
        displayName: 'مستخدم عماني',
        status: AccountStatus.ACTIVE,
        role: UserRole.USER,
        isVerified: true,
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await service.verifyOtp(
        { phone: '91234567', code: '123456' },
        '10.0.0.1',
        'MobileApp/1.0',
      );

      expect(res.accessToken).toBe('jwt-mock-access-token');
      expect(res.refreshToken).toBe('mock-refresh-token');
      expect(res.user.id).toBe('usr_existing_1');

      expect(mockAccountStatusService.assertCanAuthenticate).toHaveBeenCalledWith(
        mockUser,
      );
      expect(mockAudit.logAudit).toHaveBeenCalledWith({
        email: 'phone:***4567',
        userId: 'usr_existing_1',
        success: true,
        method: 'PHONE',
        ip: '10.0.0.1',
        userAgent: 'MobileApp/1.0',
      });
      // User already exists, blacklist check for signup is not needed
      expect(mockBanBlacklistService.isPhoneBlocked).not.toHaveBeenCalled();
    });

    it('existing banned user throws 403 ACCOUNT_BANNED and logs audit with failure', async () => {
      mockPhoneOtpService.verify.mockResolvedValue({ verified: true });
      const mockBannedUser = {
        id: 'usr_banned_1',
        phone: '+96891234567',
        phoneE164: '+96891234567',
        status: AccountStatus.BANNED,
        role: UserRole.USER,
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockBannedUser);
      mockAccountStatusService.assertCanAuthenticate.mockRejectedValue(
        new ForbiddenException({
          statusCode: 403,
          code: 'ACCOUNT_BANNED',
          message: 'تم حظر حسابك لمخالفة شروط الاستخدام',
        }),
      );

      await expect(
        service.verifyOtp({ phone: '91234567', code: '123456' }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.FORBIDDEN,
          response: expect.objectContaining({ code: 'ACCOUNT_BANNED' }),
        }),
      );

      expect(mockAudit.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'phone:***4567',
          userId: 'usr_banned_1',
          success: false,
          reason: 'ACCOUNT_BANNED',
          method: 'PHONE',
        }),
      );
    });

    it('existing suspended user throws 403 ACCOUNT_SUSPENDED and logs audit with failure', async () => {
      mockPhoneOtpService.verify.mockResolvedValue({ verified: true });
      const mockSuspendedUser = {
        id: 'usr_suspended_1',
        phone: '+96891234567',
        phoneE164: '+96891234567',
        status: AccountStatus.SUSPENDED,
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockSuspendedUser);
      mockAccountStatusService.assertCanAuthenticate.mockRejectedValue(
        new ForbiddenException({
          statusCode: 403,
          code: 'ACCOUNT_SUSPENDED',
          message: 'تم إيقاف حسابك مؤقتاً',
        }),
      );

      await expect(
        service.verifyOtp({ phone: '91234567', code: '123456' }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.FORBIDDEN,
          response: expect.objectContaining({ code: 'ACCOUNT_SUSPENDED' }),
        }),
      );

      expect(mockAudit.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'phone:***4567',
          userId: 'usr_suspended_1',
          success: false,
          reason: 'ACCOUNT_SUSPENDED',
          method: 'PHONE',
        }),
      );
    });

    it('new phone that is blacklisted throws 403 PHONE_NOT_ALLOWED without creating a user', async () => {
      mockPhoneOtpService.verify.mockResolvedValue({ verified: true });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBanBlacklistService.isPhoneBlocked.mockResolvedValue(true);

      await expect(
        service.verifyOtp({ phone: '91234567', code: '123456' }),
      ).rejects.toThrow(
        expect.objectContaining({
          status: HttpStatus.FORBIDDEN,
          response: expect.objectContaining({
            code: 'PHONE_NOT_ALLOWED',
            message: 'رقم الهاتف غير مسموح به',
          }),
        }),
      );

      expect(mockAudit.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'phone:***4567',
          success: false,
          reason: 'PHONE_NOT_ALLOWED',
          method: 'PHONE',
        }),
      );
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('new phone not in blacklist creates new verified user (Signup v2) with hex username and displayName', async () => {
      mockPhoneOtpService.verify.mockResolvedValue({ verified: true });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBanBlacklistService.isPhoneBlocked.mockResolvedValue(false);

      const createdUserMock = {
        id: 'usr_new_99',
        username: 'user_a1b2c3d4',
        displayName: 'مستخدم 4567',
        phone: '+96891234567',
        phoneE164: '+96891234567',
        phoneVerifiedAt: new Date(),
        isVerified: true,
        status: AccountStatus.ACTIVE,
        role: UserRole.USER,
      };
      mockPrisma.user.create.mockResolvedValue(createdUserMock);

      const res = await service.verifyOtp(
        { phone: '91234567', code: '123456' },
        '10.10.10.10',
        'Browser/Test',
      );

      expect(res.accessToken).toBe('jwt-mock-access-token');
      expect(res.refreshToken).toBe('mock-refresh-token');
      expect(res.user.id).toBe('usr_new_99');

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '+96891234567',
            phoneE164: '+96891234567',
            displayName: 'مستخدم 4567',
            isVerified: true,
            status: AccountStatus.ACTIVE,
            username: expect.stringMatching(/^user_[a-f0-9]{8}$/),
          }),
        }),
      );

      expect(mockAudit.logAudit).toHaveBeenCalledWith({
        email: 'phone:***4567',
        userId: 'usr_new_99',
        success: true,
        method: 'PHONE',
        ip: '10.10.10.10',
        userAgent: 'Browser/Test',
      });
    });

    it('handles concurrent verify race: catches P2002 on phoneE164, re-queries winner, and logs in with winner', async () => {
      mockPhoneOtpService.verify.mockResolvedValue({ verified: true });
      // Initial lookup returns null
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)
        // Winner lookup after P2002 returns winning user
        .mockResolvedValueOnce({
          id: 'usr_winner_77',
          username: 'user_winner',
          displayName: 'مستخدم 4567',
          phone: '+96891234567',
          phoneE164: '+96891234567',
          isVerified: true,
          status: AccountStatus.ACTIVE,
        });

      mockBanBlacklistService.isPhoneBlocked.mockResolvedValue(false);

      const p2002Error: any = new Error('Unique constraint failed');
      p2002Error.code = 'P2002';
      p2002Error.meta = { target: ['phoneE164'] };
      mockPrisma.user.create.mockRejectedValue(p2002Error);

      const res = await service.verifyOtp({ phone: '91234567', code: '123456' });

      expect(res.accessToken).toBe('jwt-mock-access-token');
      expect(res.refreshToken).toBe('mock-refresh-token');
      expect(res.user.id).toBe('usr_winner_77');
      expect(mockAccountStatusService.assertCanAuthenticate).toHaveBeenCalled();
    });

    it('rethrows P2002 if target is unknown', async () => {
      mockPhoneOtpService.verify.mockResolvedValue({ verified: true });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBanBlacklistService.isPhoneBlocked.mockResolvedValue(false);

      const p2002Unknown: any = new Error('Unknown constraint');
      p2002Unknown.code = 'P2002';
      p2002Unknown.meta = { target: ['unknown_field'] };
      mockPrisma.user.create.mockRejectedValue(p2002Unknown);

      await expect(
        service.verifyOtp({ phone: '91234567', code: '123456' }),
      ).rejects.toThrow(p2002Unknown);
    });

    it('retries username collision on P2002 and succeeds on next attempt', async () => {
      mockPhoneOtpService.verify.mockResolvedValue({ verified: true });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockBanBlacklistService.isPhoneBlocked.mockResolvedValue(false);

      const usernameConflict: any = new Error('Username taken');
      usernameConflict.code = 'P2002';
      usernameConflict.meta = { target: ['username'] };

      const successfulUser = {
        id: 'usr_retry_success',
        username: 'user_retry_win',
        phoneE164: '+96891234567',
        isVerified: true,
        status: AccountStatus.ACTIVE,
      };

      mockPrisma.user.create
        .mockRejectedValueOnce(usernameConflict)
        .mockResolvedValueOnce(successfulUser);

      const res = await service.verifyOtp({ phone: '91234567', code: '123456' });

      expect(res.user.id).toBe('usr_retry_success');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(2);
    });
  });
});
