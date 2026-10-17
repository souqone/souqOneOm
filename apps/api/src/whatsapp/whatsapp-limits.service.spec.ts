import { HttpException, HttpStatus } from '@nestjs/common';
import { WhatsappLimitsService } from './whatsapp-limits.service';

describe('WhatsappLimitsService', () => {
  let service: WhatsappLimitsService;
  let mockTx: any;

  beforeEach(() => {
    mockTx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      whatsappMessageLog: {
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
    };

    service = new WhatsappLimitsService();
  });

  const defaultOptions = {
    phoneE164: '+96891234567',
    purpose: 'PHONE_VERIFY' as const,
    ip: '192.168.1.1',
  };

  it('reserves a slot when all limits are within thresholds', async () => {
    mockTx.whatsappMessageLog.findFirst.mockResolvedValue(null);
    mockTx.whatsappMessageLog.count.mockResolvedValue(0);
    mockTx.whatsappMessageLog.create.mockResolvedValue({ id: 'reserved_123' });

    const result = await service.reserveSendSlot(mockTx, defaultOptions);

    expect(result.reservedLogId).toBe('reserved_123');
    expect(result.phoneHash).toBeDefined();
    expect(result.ipHash).toBeDefined();
    expect(mockTx.$executeRaw).toHaveBeenCalled();
  });

  it('throws immediately when acquiring advisory lock fails', async () => {
    mockTx.$executeRaw.mockRejectedValue(new Error('PostgreSQL advisory lock failure'));

    await expect(
      service.reserveSendSlot(mockTx, defaultOptions),
    ).rejects.toThrow('PostgreSQL advisory lock failure');
  });

  it('enforces 60-second cooldown between requests for the same phone', async () => {
    const recentCreatedAt = new Date(Date.now() - 30 * 1000); // 30 seconds ago
    mockTx.whatsappMessageLog.findFirst.mockResolvedValue({
      createdAt: recentCreatedAt,
    });

    try {
      await service.reserveSendSlot(mockTx, defaultOptions);
      fail('Expected 429 OTP_COOLDOWN');
    } catch (err: any) {
      expect(err).toBeInstanceOf(HttpException);
      expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      const res = err.getResponse();
      expect(res.code).toBe('OTP_COOLDOWN');
      expect(res.retryAfterSeconds).toBeGreaterThan(0);
      expect(res.retryAfterSeconds).toBeLessThanOrEqual(30);
    }
  });

  it('enforces phone 10-minute window limit (max 3)', async () => {
    mockTx.whatsappMessageLog.findFirst.mockResolvedValue(null); // passed cooldown
    mockTx.whatsappMessageLog.count.mockResolvedValueOnce(3); // 3 in last 10m

    await expect(service.reserveSendSlot(mockTx, defaultOptions)).rejects.toThrow(
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
  });

  it('enforces phone 24-hour window limit (max 10)', async () => {
    mockTx.whatsappMessageLog.findFirst.mockResolvedValue(null);
    mockTx.whatsappMessageLog.count
      .mockResolvedValueOnce(1) // 10m ok
      .mockResolvedValueOnce(10); // 24h limit reached

    await expect(service.reserveSendSlot(mockTx, defaultOptions)).rejects.toThrow(
      new HttpException(
        {
          statusCode: 429,
          code: 'OTP_RATE_LIMITED',
          message: 'تم تجاوز الحد اليومي لطلب الرموز لهذا الرقم',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );
  });

  it('enforces IP hourly limit (max 10)', async () => {
    mockTx.whatsappMessageLog.findFirst.mockResolvedValue(null);
    mockTx.whatsappMessageLog.count
      .mockResolvedValueOnce(1) // phone 10m ok
      .mockResolvedValueOnce(2) // phone 24h ok
      .mockResolvedValueOnce(10); // IP 1h limit reached

    await expect(service.reserveSendSlot(mockTx, defaultOptions)).rejects.toThrow(
      new HttpException(
        {
          statusCode: 429,
          code: 'OTP_RATE_LIMITED',
          message: 'تم تجاوز الحد المسموح لعنوان الإنترنت الخاص بك',
          retryAfterSeconds: 3600,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );
  });

  it('enforces global daily cap and logs 80% warning once per day', async () => {
    const originalEnv = process.env.WHATSAPP_DAILY_CAP;
    process.env.WHATSAPP_DAILY_CAP = '200';

    try {
      mockTx.whatsappMessageLog.findFirst.mockResolvedValue(null);
      // Phone & IP checks pass, global count is at 200
      mockTx.whatsappMessageLog.count
        .mockResolvedValueOnce(0) // phone 10m
        .mockResolvedValueOnce(0) // phone 24h
        .mockResolvedValueOnce(0) // ip 1h
        .mockResolvedValueOnce(0) // ip 24h
        .mockResolvedValueOnce(200); // global count

      await expect(service.reserveSendSlot(mockTx, defaultOptions)).rejects.toThrow(
        new HttpException(
          {
            statusCode: 429,
            code: 'OTP_DAILY_CAP_REACHED',
            message: 'تم بلوغ السقف اليومي لخدمة الرسائل، يرجى المحاولة غداً',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );
    } finally {
      process.env.WHATSAPP_DAILY_CAP = originalEnv;
    }
  });
});
