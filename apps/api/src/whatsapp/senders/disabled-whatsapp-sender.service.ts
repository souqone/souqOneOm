import { Injectable, Logger } from '@nestjs/common';
import {
  WhatsappOtpSender,
  SendWhatsappOtpOptions,
  SendWhatsappOtpResult,
  WhatsappOtpError,
} from './whatsapp-sender.interface';

@Injectable()
export class DisabledWhatsappOtpSender implements WhatsappOtpSender {
  private readonly logger = new Logger(DisabledWhatsappOtpSender.name);

  constructor(private readonly reason: string = 'WhatsApp OTP provider is not configured') {}

  async send(_options: SendWhatsappOtpOptions): Promise<SendWhatsappOtpResult> {
    this.logger.warn(`WhatsApp OTP send attempt rejected: ${this.reason}`);
    throw new WhatsappOtpError('PROVIDER_UNAVAILABLE', this.reason);
  }
}
