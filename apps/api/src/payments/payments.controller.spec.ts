import { Test, TestingModule } from '@nestjs/testing';
import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PAYMENT_WEBHOOK_QUEUE } from './payment-webhook.processor';

describe('PaymentsController — Webhook Fail-Closed & Timing-Safe', () => {
  let controller: PaymentsController;
  let mockQueue: { add: jest.Mock };
  let mockPaymentsService: Partial<PaymentsService>;
  const originalEnv = process.env.THAWANI_WEBHOOK_SECRET;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    mockPaymentsService = {
      handleWebhook: jest.fn().mockResolvedValue({ received: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: `BullQueue_${PAYMENT_WEBHOOK_QUEUE}`, useValue: mockQueue },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.THAWANI_WEBHOOK_SECRET = originalEnv;
    } else {
      delete process.env.THAWANI_WEBHOOK_SECRET;
    }
    jest.clearAllMocks();
  });

  describe('POST /payments/webhook', () => {
    it('W01 — should throw ServiceUnavailableException (503) when THAWANI_WEBHOOK_SECRET is not configured (undefined)', async () => {
      delete process.env.THAWANI_WEBHOOK_SECRET;

      await expect(
        controller.webhook({ data: { session_id: 'sess_123' } }, 'any-incoming-secret'),
      ).rejects.toThrow(ServiceUnavailableException);

      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('W02 — should throw ServiceUnavailableException (503) when THAWANI_WEBHOOK_SECRET is empty string', async () => {
      process.env.THAWANI_WEBHOOK_SECRET = '';

      await expect(
        controller.webhook({ data: { session_id: 'sess_123' } }, 'any-incoming-secret'),
      ).rejects.toThrow(ServiceUnavailableException);

      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('W03 — should throw UnauthorizedException (401) when x-thawani-secret header is missing', async () => {
      process.env.THAWANI_WEBHOOK_SECRET = 'correct-webhook-secret-1234';

      await expect(
        controller.webhook({ data: { session_id: 'sess_123' } }, undefined),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('W04 — should throw UnauthorizedException (401) when x-thawani-secret header is incorrect', async () => {
      process.env.THAWANI_WEBHOOK_SECRET = 'correct-webhook-secret-1234';

      await expect(
        controller.webhook({ data: { session_id: 'sess_123' } }, 'wrong-webhook-secret-5678'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('W05 — should accept request (200) and enqueue job when x-thawani-secret matches expected secret', async () => {
      process.env.THAWANI_WEBHOOK_SECRET = 'correct-webhook-secret-1234';

      const payload = { data: { session_id: 'sess_123', payment_status: 'paid' } };
      const response = await controller.webhook(payload, 'correct-webhook-secret-1234');

      expect(response).toEqual({ received: true });
      expect(mockQueue.add).toHaveBeenCalledTimes(1);
      expect(mockQueue.add).toHaveBeenCalledWith(
        { body: payload },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
    });

    it('W06 — should log missing secret warning only once across multiple requests', async () => {
      delete process.env.THAWANI_WEBHOOK_SECRET;
      const loggerErrorSpy = jest.spyOn((controller as any).logger, 'error');

      // Request 1
      await expect(controller.webhook({ test: 1 })).rejects.toThrow(ServiceUnavailableException);
      // Request 2
      await expect(controller.webhook({ test: 2 })).rejects.toThrow(ServiceUnavailableException);
      // Request 3
      await expect(controller.webhook({ test: 3 })).rejects.toThrow(ServiceUnavailableException);

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
    });
  });
});
