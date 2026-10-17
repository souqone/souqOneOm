import { createWhatsappOtpSender } from './senders/whatsapp-sender.provider';
import { MockWhatsappOtpSender } from './senders/mock-whatsapp-sender.service';
import { MetaWhatsappOtpSender } from './senders/meta-whatsapp-sender.service';
import { DisabledWhatsappOtpSender } from './senders/disabled-whatsapp-sender.service';

describe('WhatsappSenderFactory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Non-production environments', () => {
    it('defaults to MockWhatsappOtpSender', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.WHATSAPP_PROVIDER;

      const sender = createWhatsappOtpSender();
      expect(sender).toBeInstanceOf(MockWhatsappOtpSender);
    });

    it('returns MetaWhatsappOtpSender when meta is configured with credentials', () => {
      process.env.NODE_ENV = 'development';
      process.env.WHATSAPP_PROVIDER = 'meta';
      process.env.WHATSAPP_PHONE_NUMBER_ID = '12345';
      process.env.WHATSAPP_ACCESS_TOKEN = 'secret_token';

      const sender = createWhatsappOtpSender();
      expect(sender).toBeInstanceOf(MetaWhatsappOtpSender);
    });
  });

  describe('Production environment', () => {
    it('returns MetaWhatsappOtpSender when properly configured in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.WHATSAPP_PROVIDER = 'meta';
      process.env.WHATSAPP_PHONE_NUMBER_ID = '12345';
      process.env.WHATSAPP_ACCESS_TOKEN = 'secret_token';

      const sender = createWhatsappOtpSender();
      expect(sender).toBeInstanceOf(MetaWhatsappOtpSender);
    });

    it('falls back to DisabledWhatsappOtpSender when unconfigured in production (does not crash)', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.WHATSAPP_PROVIDER;
      delete process.env.WHATSAPP_PHONE_NUMBER_ID;
      delete process.env.WHATSAPP_ACCESS_TOKEN;

      const sender = createWhatsappOtpSender();
      expect(sender).toBeInstanceOf(DisabledWhatsappOtpSender);
    });

    it('never auto-enables MockWhatsappOtpSender in production even if requested', () => {
      process.env.NODE_ENV = 'production';
      process.env.WHATSAPP_PROVIDER = 'mock';

      const sender = createWhatsappOtpSender();
      expect(sender).toBeInstanceOf(DisabledWhatsappOtpSender);
      expect(sender).not.toBeInstanceOf(MockWhatsappOtpSender);
    });
  });
});
