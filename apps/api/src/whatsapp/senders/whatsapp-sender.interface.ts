export const WHATSAPP_OTP_SENDER = 'WHATSAPP_OTP_SENDER';

export type WhatsappOtpErrorCode =
  | 'INVALID_RECIPIENT'
  | 'PROVIDER_REJECTED'
  | 'PROVIDER_UNAVAILABLE';

export class WhatsappOtpError extends Error {
  constructor(
    public readonly code: WhatsappOtpErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'WhatsappOtpError';
  }
}

export interface SendWhatsappOtpOptions {
  phoneE164: string;
  code: string;
  locale?: string;
}

export interface SendWhatsappOtpResult {
  providerMessageId: string;
}

export interface WhatsappOtpSender {
  send(options: SendWhatsappOtpOptions): Promise<SendWhatsappOtpResult>;
}
