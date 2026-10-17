import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { PhoneVerificationService } from './phone-verification.service';

describe('PhoneVerificationService', () => {
  let service: PhoneVerificationService;
  let mockPrisma: any;
  let mockPhoneOtpService: any;

  const mockUser = {
    id: 'user_1',
    phone: '+96891234567',
    phoneE164: null,
    phoneVerifiedAt: null,
  };

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'user_1') {
            return Promise.resolve({ ...mockUser });
          }
          if (where.phoneE164) {
            return Promise.resolve(null);
          }
          return Promise.resolve(null);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          return Promise.resolve({
            ...mockUser,
            ...data,
          });
        }),
      },
    };

    mockPhoneOtpService = {
      request: jest.fn().mockResolvedValue({ providerMessageId: 'wamid.123' }),
      verify: jest.fn().mockResolvedValue({ verified: true }),
    };

    service = new PhoneVerificationService(
      mockPrisma,
      mockPhoneOtpService,
    );
  });

  describe('requestVerification', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.requestVerification('non_existent', '127.0.0.1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 400 PHONE_REQUIRED when user has no phone', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        phone: null,
      });

      await expect(
        service.requestVerification('user_1', '127.0.0.1'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 400,
            code: 'PHONE_REQUIRED',
            message: 'يرجى إضافة رقم الهاتف في ملفك الشخصي أولاً قبل طلب التوثيق',
          }),
        }),
      );

      expect(mockPhoneOtpService.request).not.toHaveBeenCalled();
    });

    it('throws 400 PHONE_REQUIRED when user phone is empty or whitespace', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        phone: '   ',
      });

      await expect(
        service.requestVerification('user_1', '127.0.0.1'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 400,
            code: 'PHONE_REQUIRED',
          }),
        }),
      );

      expect(mockPhoneOtpService.request).not.toHaveBeenCalled();
    });

    it('throws 400 PHONE_INVALID when user phone is invalid for country allowlist', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        phone: '+971501234567', // UAE not in default allowlist (968, 20)
      });

      await expect(
        service.requestVerification('user_1', '127.0.0.1'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 400,
            code: 'PHONE_INVALID',
            message: 'رقم الهاتف الحالي غير صالح أو غير مدعوم، يرجى تعديله في الملف الشخصي',
          }),
        }),
      );

      expect(mockPhoneOtpService.request).not.toHaveBeenCalled();
    });

    it('returns { alreadyVerified: true } when user is already verified on the same phone', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        phone: '91234567',
        phoneE164: '+96891234567',
        phoneVerifiedAt: new Date('2026-01-01'),
      });

      const res = await service.requestVerification('user_1', '127.0.0.1');

      expect(res).toEqual({ alreadyVerified: true });
      expect(mockPhoneOtpService.request).not.toHaveBeenCalled();
    });

    it('throws 409 PHONE_ALREADY_VERIFIED when phone is verified by another user without calling otp request', async () => {
      // Find user returns current user, findUnique on phoneE164 returns user_2
      mockPrisma.user.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'user_1') {
          return Promise.resolve({ ...mockUser, phone: '91234567' });
        }
        if (where.phoneE164 === '+96891234567') {
          return Promise.resolve({ id: 'user_2' });
        }
        return Promise.resolve(null);
      });

      await expect(
        service.requestVerification('user_1', '127.0.0.1'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 409,
            code: 'PHONE_ALREADY_VERIFIED',
            message: 'رقم الهاتف هذا موثق بالفعل لحساب آخر',
          }),
        }),
      );

      // CRITICAL: Must not call PhoneOtpService.request or reserve send slots
      expect(mockPhoneOtpService.request).not.toHaveBeenCalled();
    });

    it('successfully calls PhoneOtpService.request and returns { sent: true }', async () => {
      const res = await service.requestVerification('user_1', '10.0.0.1');

      expect(res).toEqual({ sent: true });
      expect(mockPhoneOtpService.request).toHaveBeenCalledWith({
        phoneE164: '+96891234567',
        purpose: 'PHONE_VERIFY',
        ip: '10.0.0.1',
        userId: 'user_1',
      });
    });

    it('propagates OTP limits and cooldown errors from PhoneOtpService.request', async () => {
      mockPhoneOtpService.request.mockRejectedValueOnce(
        new HttpException(
          { statusCode: 429, code: 'OTP_COOLDOWN', message: 'يرجى الانتظار' },
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );

      await expect(
        service.requestVerification('user_1', '127.0.0.1'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 429,
            code: 'OTP_COOLDOWN',
          }),
        }),
      );
    });
  });

  describe('verifyPhone', () => {
    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.verifyPhone('non_existent', '123456'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 400 PHONE_REQUIRED when user phone is missing', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        phone: null,
      });

      await expect(
        service.verifyPhone('user_1', '123456'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 400,
            code: 'PHONE_REQUIRED',
          }),
        }),
      );

      expect(mockPhoneOtpService.verify).not.toHaveBeenCalled();
    });

    it('returns { phoneVerified: true } idempotently when user is already verified on same number', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        phone: '91234567',
        phoneE164: '+96891234567',
        phoneVerifiedAt: new Date(),
      });

      const res = await service.verifyPhone('user_1', '123456');

      expect(res).toEqual({ phoneVerified: true });
      expect(mockPhoneOtpService.verify).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('throws 409 PHONE_ALREADY_VERIFIED when phone is claimed by another user and does not burn OTP', async () => {
      mockPrisma.user.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'user_1') {
          return Promise.resolve({ ...mockUser, phone: '91234567' });
        }
        if (where.phoneE164 === '+96891234567') {
          return Promise.resolve({ id: 'user_2' });
        }
        return Promise.resolve(null);
      });

      await expect(
        service.verifyPhone('user_1', '123456'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 409,
            code: 'PHONE_ALREADY_VERIFIED',
          }),
        }),
      );

      // OTP verification must not be called, preserving the challenge
      expect(mockPhoneOtpService.verify).not.toHaveBeenCalled();
    });

    it('propagates INVALID_OTP error when OTP code is incorrect', async () => {
      mockPhoneOtpService.verify.mockRejectedValueOnce(
        new HttpException(
          { statusCode: 400, code: 'INVALID_OTP', message: 'رمز التحقق غير صحيح' },
          HttpStatus.BAD_REQUEST,
        ),
      );

      await expect(
        service.verifyPhone('user_1', '000000'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 400,
            code: 'INVALID_OTP',
          }),
        }),
      );

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('propagates MISSING_OR_EXPIRED when phone changed between request and verify', async () => {
      mockPhoneOtpService.verify.mockRejectedValueOnce(
        new HttpException(
          { statusCode: 400, code: 'MISSING_OR_EXPIRED', message: 'رمز التحقق غير صالح أو انتهت صلاحيته' },
          HttpStatus.BAD_REQUEST,
        ),
      );

      await expect(
        service.verifyPhone('user_1', '123456'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 400,
            code: 'MISSING_OR_EXPIRED',
          }),
        }),
      );

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('propagates TOO_MANY_ATTEMPTS when verification attempts exceed limit', async () => {
      mockPhoneOtpService.verify.mockRejectedValueOnce(
        new HttpException(
          { statusCode: 429, code: 'TOO_MANY_ATTEMPTS', message: 'تم تجاوز عدد محاولات إدخال الرمز' },
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );

      await expect(
        service.verifyPhone('user_1', '123456'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 429,
            code: 'TOO_MANY_ATTEMPTS',
          }),
        }),
      );

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('successfully verifies OTP, updates user phoneE164 and phoneVerifiedAt, and returns { phoneVerified: true }', async () => {
      const res = await service.verifyPhone('user_1', '123456');

      expect(res).toEqual({ phoneVerified: true });
      expect(mockPhoneOtpService.verify).toHaveBeenCalledWith({
        phoneE164: '+96891234567',
        purpose: 'PHONE_VERIFY',
        code: '123456',
        userId: 'user_1',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_1' },
        data: {
          phoneE164: '+96891234567',
          phoneVerifiedAt: expect.any(Date),
        },
      });
    });

    it('catches Prisma P2002 unique constraint failure during race condition and throws 409 PHONE_ALREADY_VERIFIED', async () => {
      const p2002Err: any = new Error('Unique constraint failed on the fields: (`phoneE164`)');
      p2002Err.code = 'P2002';
      p2002Err.meta = { target: ['phoneE164'] };

      mockPrisma.user.update.mockRejectedValueOnce(p2002Err);

      await expect(
        service.verifyPhone('user_1', '123456'),
      ).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 409,
            code: 'PHONE_ALREADY_VERIFIED',
            message: 'رقم الهاتف هذا موثق بالفعل لحساب آخر',
          }),
        }),
      );
    });
  });
});
