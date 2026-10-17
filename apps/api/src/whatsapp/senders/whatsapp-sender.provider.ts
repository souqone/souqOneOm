import { Provider, Logger } from '@nestjs/common';
import {
  WHATSAPP_OTP_SENDER,
  WhatsappOtpSender,
} from './whatsapp-sender.interface';
import { MockWhatsappOtpSender } from './mock-whatsapp-sender.service';
import { MetaWhatsappOtpSender } from './meta-whatsapp-sender.service';
import { DisabledWhatsappOtpSender } from './disabled-whatsapp-sender.service';

export function createWhatsappOtpSender(): WhatsappOtpSender {
  const logger = new Logger('WhatsappSenderFactory');
  const isProd = process.env.NODE_ENV === 'production';
  const provider = (process.env.WHATSAPP_PROVIDER || '').trim().toLowerCase();
  const phoneId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
  const token = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();

  if (isProd) {
    if (provider === 'meta' && phoneId && token) {
      logger.log('WhatsApp OTP initialized with Meta Cloud API provider in production');
      return new MetaWhatsappOtpSender();
    }

    logger.warn(
      'WhatsApp OTP is unconfigured or disabled in production (requires WHATSAPP_PROVIDER=meta, phoneId, and token). Falling back to DisabledWhatsappOtpSender.',
    );
    return new DisabledWhatsappOtpSender(
      'WhatsApp OTP provider is unconfigured or disabled in production',
    );
  }

  // Non-production (development, test)
  if (provider === 'meta' && phoneId && token) {
    logger.log('WhatsApp OTP initialized with Meta Cloud API provider in development');
    return new MetaWhatsappOtpSender();
  }

  logger.log('WhatsApp OTP initialized with Mock provider in non-production');
  return new MockWhatsappOtpSender();
}

export const WhatsappSenderProvider: Provider = {
  provide: WHATSAPP_OTP_SENDER,
  useFactory: createWhatsappOtpSender,
};
