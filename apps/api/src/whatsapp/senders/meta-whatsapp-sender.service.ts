import { Injectable, Logger } from '@nestjs/common';
import {
  WhatsappOtpSender,
  SendWhatsappOtpOptions,
  SendWhatsappOtpResult,
  WhatsappOtpError,
} from './whatsapp-sender.interface';

export interface MetaSenderConfig {
  phoneNumberId?: string;
  accessToken?: string;
  templateName?: string;
  templateLang?: string;
  graphVersion?: string;
  timeoutMs?: number;
}

interface ResolvedMetaSenderConfig {
  phoneNumberId: string;
  accessToken: string;
  templateName: string;
  templateLang?: string;
  graphVersion: string;
  timeoutMs: number;
}

@Injectable()
export class MetaWhatsappOtpSender implements WhatsappOtpSender {
  private readonly logger = new Logger(MetaWhatsappOtpSender.name);

  constructor(private readonly config?: MetaSenderConfig) {}

  private getConfig(): ResolvedMetaSenderConfig {
    const phoneNumberId =
      this.config?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    const accessToken =
      this.config?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || '';
    const templateName =
      this.config?.templateName ||
      process.env.WHATSAPP_TEMPLATE_NAME ||
      'auth_otp';
    const templateLang =
      this.config?.templateLang ||
      process.env.WHATSAPP_TEMPLATE_LANG;
    const graphVersion =
      this.config?.graphVersion ||
      process.env.WHATSAPP_GRAPH_VERSION ||
      'v21.0';
    const timeoutMs = this.config?.timeoutMs || 5000;

    return {
      phoneNumberId,
      accessToken,
      templateName,
      templateLang,
      graphVersion,
      timeoutMs,
    };
  }

  async send(options: SendWhatsappOtpOptions): Promise<SendWhatsappOtpResult> {
    const {
      phoneNumberId,
      accessToken,
      templateName,
      templateLang,
      graphVersion,
      timeoutMs,
    } = this.getConfig();

    if (!phoneNumberId || !accessToken) {
      throw new WhatsappOtpError(
        'PROVIDER_UNAVAILABLE',
        'Meta WhatsApp sender is not configured (missing phone number ID or access token)',
      );
    }

    // Recipient in Cloud API expects international number digits (E.164 with or without '+')
    // Normalizing to clean digits for Meta API: e.g. +96891234567 -> 96891234567
    const recipient = options.phoneE164.replace(/[^\d]/g, '');

    const url = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;

    // WhatsApp Cloud API Authentication template payload
    // Includes body parameter (code) and copy-code button component (index 0, sub_type url)
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: templateLang || options.locale || 'ar',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: options.code,
              },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
              {
                type: 'text',
                text: options.code,
              },
            ],
          },
        ],
      },
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err: any) {
      this.logger.error(
        `Meta WhatsApp API request failed or timed out: ${err?.message || 'Network error'}`,
      );
      throw new WhatsappOtpError(
        'PROVIDER_UNAVAILABLE',
        'Meta WhatsApp API request timed out or network error occurred',
        err,
      );
    }

    let json: any = null;
    try {
      json = await response.json();
    } catch {
      // response not JSON
    }

    if (!response.ok) {
      const status = response.status;
      const errorData = json?.error;
      const metaErrorCode = errorData?.code;
      const metaErrorSubcode = errorData?.error_subcode;

      this.logger.warn(
        `Meta WhatsApp API error response: status=${status}, code=${metaErrorCode}, subcode=${metaErrorSubcode}`,
      );

      // Map Meta error codes to classified WhatsappOtpError
      if (
        status === 400 &&
        (metaErrorCode === 100 ||
          metaErrorCode === 131026 ||
          metaErrorCode === 131009 ||
          metaErrorSubcode === 2494011)
      ) {
        throw new WhatsappOtpError(
          'INVALID_RECIPIENT',
          'Recipient phone number is invalid or not registered on WhatsApp',
        );
      }

      if (status === 401 || status === 403 || metaErrorCode === 190) {
        throw new WhatsappOtpError(
          'PROVIDER_REJECTED',
          'Meta WhatsApp provider authentication or authorization failed',
        );
      }

      throw new WhatsappOtpError(
        'PROVIDER_UNAVAILABLE',
        `Meta WhatsApp provider failed with status ${status}`,
      );
    }

    const providerMessageId = json?.messages?.[0]?.id;
    if (!providerMessageId) {
      this.logger.error(
        'Meta WhatsApp API response did not contain message id',
      );
      throw new WhatsappOtpError(
        'PROVIDER_UNAVAILABLE',
        'Meta WhatsApp API response missing message ID',
      );
    }

    return { providerMessageId };
  }
}
