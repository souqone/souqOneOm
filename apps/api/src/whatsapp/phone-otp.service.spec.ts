import { HttpException, HttpStatus } from '@nestjs/common';
import { PhoneOtpService } from './phone-otp.service';
import { WhatsappOtpError } from './senders/whatsapp-sender.interface';

describe('PhoneOtpService', () => {
  let service: PhoneOtpService;
  let mockPrisma: any;
  let mockOtpService: any;
  let mockLimitsService: any;
  let mockSender: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn(async (cb) => {
        return cb({});
      }),
      whatsappMessageLog: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    mockOtpService = {
      issueForPhone: jest.fn().mockResolvedValue('123456'),
      verifyForPhone: jest.fn(),
      invalidateActiveForPhone: jest.fn().mockResolvedValue(undefined),
    };

    mockLimitsService = {
      reserveSendSlot: jest.fn().mockResolvedValue({
        reservedLogId: 'log_reserved_1',
        phoneHash: 'phash',
        ipHash: 'iphash',
      }),
    };

    mockSender = {
      send: jest.fn().mockResolvedValue({ providerMessageId: 'wamid_test_123' }),
    };

    service = new PhoneOtpService(
      mockPrisma,
      mockOtpService,
      mockLimitsService,
      mockSender,
    );
  });

  describe('request', () => {
    it('rejects disallowed countries with 400 PHONE_COUNTRY_NOT_ALLOWED', async () => {
      // UAE +971 is not in default allowlist (968, 20)
      await expect(
        service.request({
          phoneE164: '+971501234567',
          purpose: 'PHONE_VERIFY',
        }),
      ).rejects.toThrow(
        new HttpException(
          {
            statusCode: 400,
            code: 'PHONE_COUNTRY_NOT_ALLOWED',
            message: 'رقم الهاتف غير صالح أو الدولة غير مدعومة حالياً',
          },
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(mockLimitsService.reserveSendSlot).not.toHaveBeenCalled();
      expect(mockSender.send).not.toHaveBeenCalled();
    });

    it('processes valid request, sends code, updates log, and returns providerMessageId without raw code', async () => {
      const result = await service.request({
        phoneE164: '+96891234567',
        purpose: 'PHONE_VERIFY',
        ip: '127.0.0.1',
      });

      expect(result).toEqual({ providerMessageId: 'wamid_test_123' });
      expect(result).not.toHaveProperty('code');
      expect('code' in result).toBe(false);

      expect(mockLimitsService.reserveSendSlot).toHaveBeenCalled();
      expect(mockOtpService.issueForPhone).toHaveBeenCalled();
      expect(mockSender.send).toHaveBeenCalledWith({
        phoneE164: '+96891234567',
        code: '123456',
        locale: 'ar',
      });
      expect(mockPrisma.whatsappMessageLog.update).toHaveBeenCalledWith({
        where: { id: 'log_reserved_1' },
        data: { providerMessageId: 'wamid_test_123' },
      });
    });

    it('invalidates challenge and marks log FAILED when sender fails', async () => {
      mockSender.send.mockRejectedValueOnce(
        new WhatsappOtpError('PROVIDER_UNAVAILABLE', 'Meta API down'),
      );

      await expect(
        service.request({
          phoneE164: '+96891234567',
          purpose: 'PHONE_VERIFY',
        }),
      ).rejects.toThrow(HttpException);

      expect(mockOtpService.invalidateActiveForPhone).toHaveBeenCalledWith(
        '+96891234567',
        'PHONE_VERIFY',
      );
      expect(mockPrisma.whatsappMessageLog.update).toHaveBeenCalledWith({
        where: { id: 'log_reserved_1' },
        data: {
          status: 'FAILED',
          errorCode: 'PROVIDER_UNAVAILABLE',
        },
      });
    });

    it('simulates 10 concurrent requests to the same phone: only 1 succeeds and 9 fail with cooldown', async () => {
      let callCount = 0;
      mockLimitsService.reserveSendSlot = jest.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            reservedLogId: `log_${callCount}`,
            phoneHash: 'phash',
            ipHash: 'iphash',
          };
        }
        // Subsequent calls within cooldown window fail
        throw new HttpException(
          {
            statusCode: 429,
            code: 'OTP_COOLDOWN',
            message: 'يرجى الانتظار قبل طلب رمز تحقق جديد',
            retryAfterSeconds: 60,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      });

      const promises = Array.from({ length: 10 }, () =>
        service
          .request({
            phoneE164: '+96891234567',
            purpose: 'PHONE_VERIFY',
          })
          .then((res) => ({ success: true, res }))
          .catch((err) => ({ success: false, err })),
      );

      const results = await Promise.all(promises);
      const successes = results.filter((r) => r.success);
      const failures = results.filter((r) => !r.success);

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(9);
      for (const f of failures) {
        expect(f.err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(f.err.getResponse().code).toBe('OTP_COOLDOWN');
      }
    });

    it('returns success even if updating providerMessageId in DB fails after successful send', async () => {
      mockPrisma.whatsappMessageLog.update.mockRejectedValueOnce(
        new Error('Database connectivity issue after send'),
      );

      const result = await service.request({
        phoneE164: '+96891234567',
        purpose: 'PHONE_VERIFY',
      });

      expect(result).toEqual({ providerMessageId: 'wamid_test_123' });
      expect(mockOtpService.invalidateActiveForPhone).not.toHaveBeenCalled();
    });
  });

  describe('verify', () => {
    it('returns { verified: true } when code is correct', async () => {
      mockOtpService.verifyForPhone.mockResolvedValueOnce('OK');

      const result = await service.verify({
        phoneE164: '+96891234567',
        purpose: 'PHONE_VERIFY',
        code: '123456',
      });

      expect(result).toEqual({ verified: true });
    });

    it('forwards optional userId to otpService.verifyForPhone', async () => {
      mockOtpService.verifyForPhone.mockResolvedValueOnce('OK');

      const result = await service.verify({
        phoneE164: '+96891234567',
        purpose: 'PHONE_VERIFY',
        code: '123456',
        userId: 'user-xyz',
      });

      expect(result).toEqual({ verified: true });
      expect(mockOtpService.verifyForPhone).toHaveBeenCalledWith(
        '+96891234567',
        'PHONE_VERIFY',
        '123456',
        'user-xyz',
      );
    });

    it('throws 429 TOO_MANY_ATTEMPTS when attempts exceed limit', async () => {
      mockOtpService.verifyForPhone.mockResolvedValueOnce('TOO_MANY_ATTEMPTS');

      await expect(
        service.verify({
          phoneE164: '+96891234567',
          purpose: 'PHONE_VERIFY',
          code: '000000',
        }),
      ).rejects.toThrow(
        new HttpException(
          {
            statusCode: 429,
            code: 'TOO_MANY_ATTEMPTS',
            message: 'تم تجاوز عدد محاولات إدخال الرمز، يرجى طلب رمز جديد',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
    });

    it('throws 400 MISSING_OR_EXPIRED when challenge is expired or consumed', async () => {
      mockOtpService.verifyForPhone.mockResolvedValueOnce('MISSING_OR_EXPIRED');

      await expect(
        service.verify({
          phoneE164: '+96891234567',
          purpose: 'PHONE_VERIFY',
          code: '123456',
        }),
      ).rejects.toThrow(
        new HttpException(
          {
            statusCode: 400,
            code: 'MISSING_OR_EXPIRED',
            message: 'رمز التحقق غير صالح أو انتهت صلاحيته',
          },
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('throws 400 INVALID_OTP when code is wrong', async () => {
      mockOtpService.verifyForPhone.mockResolvedValueOnce('INVALID');

      await expect(
        service.verify({
          phoneE164: '+96891234567',
          purpose: 'PHONE_VERIFY',
          code: '999999',
        }),
      ).rejects.toThrow(
        new HttpException(
          {
            statusCode: 400,
            code: 'INVALID_OTP',
            message: 'رمز التحقق غير صحيح',
          },
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });
});
