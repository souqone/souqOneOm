import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  WhatsappOtpSender,
  SendWhatsappOtpOptions,
  SendWhatsappOtpResult,
} from './whatsapp-sender.interface';

export interface MockSentMessage {
  phoneE164: string;
  providerMessageId: string;
  locale?: string;
  sentAt: Date;
}

@Injectable()
export class MockWhatsappOtpSender implements WhatsappOtpSender {
  private readonly logger = new Logger(MockWhatsappOtpSender.name);
  private readonly sentMessages: MockSentMessage[] = [];

  async send(options: SendWhatsappOtpOptions): Promise<SendWhatsappOtpResult> {
    const providerMessageId = `mock_wamid_${crypto.randomUUID()}`;

    // Store in-memory for testing assertions (without logging raw phone or OTP code)
    this.sentMessages.push({
      phoneE164: options.phoneE164,
      providerMessageId,
      locale: options.locale,
      sentAt: new Date(),
    });

    this.logger.debug(
      `[MockWhatsappOtpSender] Message recorded (id: ${providerMessageId})`,
    );

    return { providerMessageId };
  }

  getMessages(): readonly MockSentMessage[] {
    return [...this.sentMessages];
  }

  getLastMessage(): MockSentMessage | undefined {
    return this.sentMessages[this.sentMessages.length - 1];
  }

  clearMessages(): void {
    this.sentMessages.length = 0;
  }
}
