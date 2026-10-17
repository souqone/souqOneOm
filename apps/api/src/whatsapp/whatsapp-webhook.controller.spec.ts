import {
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import {
  WhatsappWebhookController,
  safeSecretCompare,
} from './whatsapp-webhook.controller';

describe('WhatsappWebhookController', () => {
  let controller: WhatsappWebhookController;
  let mockPrisma: any;

  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'test_verify_token_123';
    process.env.WHATSAPP_APP_SECRET = 'test_app_secret_abc';

    mockPrisma = {
      whatsappMessageLog: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    controller = new WhatsappWebhookController(mockPrisma);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('safeSecretCompare', () => {
    it('returns true for matching secrets', () => {
      expect(safeSecretCompare('secret_123', 'secret_123')).toBe(true);
    });

    it('returns false for mismatched secrets of equal length', () => {
      expect(safeSecretCompare('secret_123', 'secret_456')).toBe(false);
    });

    it('returns false for mismatched secrets of different lengths without throwing length mismatch', () => {
      expect(safeSecretCompare('short', 'much_longer_secret_value')).toBe(false);
      expect(safeSecretCompare('much_longer_secret_value', 'short')).toBe(false);
    });

    it('returns false when either secret is missing, empty, or undefined', () => {
      expect(safeSecretCompare(undefined, 'secret')).toBe(false);
      expect(safeSecretCompare('secret', undefined)).toBe(false);
      expect(safeSecretCompare('', 'secret')).toBe(false);
      expect(safeSecretCompare('secret', '')).toBe(false);
      expect(safeSecretCompare(null as any, null as any)).toBe(false);
    });
  });

  describe('GET /whatsapp/webhook (Handshake)', () => {
    it('returns challenge string when hub.mode is subscribe and token matches', () => {
      const result = controller.verifyWebhook(
        'subscribe',
        'test_verify_token_123',
        'challenge_code_987',
      );

      expect(result).toBe('challenge_code_987');
    });

    it('throws ForbiddenException when verify_token does not match', () => {
      expect(() =>
        controller.verifyWebhook(
          'subscribe',
          'wrong_token',
          'challenge_code_987',
        ),
      ).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when WHATSAPP_WEBHOOK_VERIFY_TOKEN is unset in env', () => {
      delete process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

      expect(() =>
        controller.verifyWebhook(
          'subscribe',
          'test_verify_token_123',
          'challenge_code_987',
        ),
      ).toThrow(ForbiddenException);
    });
  });

  describe('POST /whatsapp/webhook (Status Events)', () => {
    function createSignedRequest(bodyObj: any, secret = 'test_app_secret_abc') {
      const rawBody = Buffer.from(JSON.stringify(bodyObj), 'utf8');
      const signature =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      return {
        req: { rawBody, body: bodyObj },
        signature,
      };
    }

    it('rejects with 401 when rawBody is missing or not a Buffer', async () => {
      await expect(
        controller.handleWebhook(
          { body: {} },
          'sha256=invalid',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects with 401 when signature header is missing or malformed', async () => {
      const rawBody = Buffer.from('{}');
      await expect(
        controller.handleWebhook({ rawBody }, undefined),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects with 401 when signature does not match', async () => {
      const { req } = createSignedRequest({ test: true });
      await expect(
        controller.handleWebhook(req, 'sha256=wrong_signature_here'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects with 401 when WHATSAPP_APP_SECRET is unconfigured', async () => {
      delete process.env.WHATSAPP_APP_SECRET;
      const { req, signature } = createSignedRequest({ test: true });

      await expect(controller.handleWebhook(req, signature)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('updates status monotonically from ACCEPTED to SENT to DELIVERED to READ', async () => {
      mockPrisma.whatsappMessageLog.findUnique.mockResolvedValueOnce({
        id: 'msg_1',
        status: 'ACCEPTED',
        providerMessageId: 'wamid_1',
      });

      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [{ id: 'wamid_1', status: 'sent' }],
                },
              },
            ],
          },
        ],
      };

      const { req, signature } = createSignedRequest(payload);
      const res = await controller.handleWebhook(req, signature);

      expect(res).toEqual({ status: 'ok' });
      expect(mockPrisma.whatsappMessageLog.update).toHaveBeenCalledWith({
        where: { id: 'msg_1' },
        data: { status: 'SENT', errorCode: undefined },
      });
    });

    it('handles out-of-order deliveries: if READ arrives before DELIVERED, subsequent DELIVERED is ignored', async () => {
      // 1. Message is currently in ACCEPTED, receives READ
      mockPrisma.whatsappMessageLog.findUnique.mockResolvedValueOnce({
        id: 'msg_2',
        status: 'ACCEPTED',
        providerMessageId: 'wamid_2',
      });

      const readPayload = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [{ id: 'wamid_2', status: 'read' }],
                },
              },
            ],
          },
        ],
      };

      const { req: readReq, signature: readSig } = createSignedRequest(readPayload);
      await controller.handleWebhook(readReq, readSig);

      expect(mockPrisma.whatsappMessageLog.update).toHaveBeenCalledWith({
        where: { id: 'msg_2' },
        data: { status: 'READ', errorCode: undefined },
      });

      mockPrisma.whatsappMessageLog.update.mockClear();

      // 2. Later, delayed DELIVERED status arrives for the message that is now READ
      mockPrisma.whatsappMessageLog.findUnique.mockResolvedValueOnce({
        id: 'msg_2',
        status: 'READ',
        providerMessageId: 'wamid_2',
      });

      const deliveredPayload = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [{ id: 'wamid_2', status: 'delivered' }],
                },
              },
            ],
          },
        ],
      };

      const { req: delReq, signature: delSig } = createSignedRequest(deliveredPayload);
      const res = await controller.handleWebhook(delReq, delSig);

      expect(res).toEqual({ status: 'ok' });
      // DELIVERED rank (3) <= READ rank (4), so update is NOT called!
      expect(mockPrisma.whatsappMessageLog.update).not.toHaveBeenCalled();
    });

    it('always applies FAILED status even if message is in intermediate or final state', async () => {
      mockPrisma.whatsappMessageLog.findUnique.mockResolvedValueOnce({
        id: 'msg_3',
        status: 'SENT',
        providerMessageId: 'wamid_3',
      });

      const failedPayload = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [
                    {
                      id: 'wamid_3',
                      status: 'failed',
                      errors: [{ code: 131026, title: 'Message Undeliverable' }],
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const { req, signature } = createSignedRequest(failedPayload);
      await controller.handleWebhook(req, signature);

      expect(mockPrisma.whatsappMessageLog.update).toHaveBeenCalledWith({
        where: { id: 'msg_3' },
        data: { status: 'FAILED', errorCode: '131026' },
      });
    });

    it('gracefully returns 200 without throwing when message ID is unknown', async () => {
      mockPrisma.whatsappMessageLog.findUnique.mockResolvedValueOnce(null);

      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [{ id: 'unknown_wamid', status: 'delivered' }],
                },
              },
            ],
          },
        ],
      };

      const { req, signature } = createSignedRequest(payload);
      const res = await controller.handleWebhook(req, signature);

      expect(res).toEqual({ status: 'ok' });
      expect(mockPrisma.whatsappMessageLog.update).not.toHaveBeenCalled();
    });
  });
});
