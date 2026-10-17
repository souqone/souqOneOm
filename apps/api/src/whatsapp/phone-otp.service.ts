import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { OtpPurpose } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../auth/otp.service';
import { PHONE_OTP_TTL_SECONDS } from '../auth/auth.constants';
import {
  normalizePhoneStrict,
  getAllowedCountryCodes,
} from '../common/utils/normalize-phone';
import {
  WHATSAPP_OTP_SENDER,
  WhatsappOtpSender,
  WhatsappOtpError,
  SendWhatsappOtpResult,
} from './senders/whatsapp-sender.interface';
import { WhatsappLimitsService } from './whatsapp-limits.service';

export interface RequestPhoneOtpOptions {
  phoneE164: string;
  purpose: OtpPurpose;
  ip?: string;
  userId?: string;
}

export interface RequestPhoneOtpResult {
  providerMessageId: string;
}

export interface VerifyPhoneOtpOptions {
  phoneE164: string;
  purpose: OtpPurpose;
  code: string;
  userId?: string;
}

export interface VerifyPhoneOtpResult {
  verified: boolean;
}

@Injectable()
export class PhoneOtpService {
  private readonly logger = new Logger(PhoneOtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly limitsService: WhatsappLimitsService,
    @Inject(WHATSAPP_OTP_SENDER)
    private readonly sender: WhatsappOtpSender,
  ) {}

  /**
   * Requests a WhatsApp OTP:
   * 1. Validates phone and country allowlist.
   * 2. Inside transaction under advisory locks: checks rate limits, reserves a log entry, and issues OTP challenge.
   * 3. Sends code via WhatsAppOtpSender outside the transaction.
   * 4. Updates log with providerMessageId on success, or marks FAILED & invalidates challenge on failure.
   */
  async request(options: RequestPhoneOtpOptions): Promise<RequestPhoneOtpResult> {
    const strictResult = normalizePhoneStrict(options.phoneE164, {
      allowedCountryCodes: getAllowedCountryCodes(),
    });

    if (!strictResult) {
      throw new HttpException(
        {
          statusCode: 400,
          code: 'PHONE_COUNTRY_NOT_ALLOWED',
          message: 'رقم الهاتف غير صالح أو الدولة غير مدعومة حالياً',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const phoneE164 = strictResult.e164;

    // 1. Check limits, reserve slot, and issue challenge inside transaction under advisory lock
    const { reservedLogId, code } = await this.prisma.$transaction(
      async (tx) => {
        const slot = await this.limitsService.reserveSendSlot(tx, {
          phoneE164,
          purpose: options.purpose,
          ip: options.ip,
        });

        const generatedCode = await this.otpService.issueForPhone(
          phoneE164,
          options.purpose,
          PHONE_OTP_TTL_SECONDS,
          options.userId,
          tx,
        );

        return {
          reservedLogId: slot.reservedLogId,
          code: generatedCode,
        };
      },
    );

    // 2. Dispatch message outside transaction
    let sendResult: SendWhatsappOtpResult;
    try {
      sendResult = await this.sender.send({
        phoneE164,
        code,
        locale: 'ar',
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to send WhatsApp OTP: ${err?.message || 'Unknown error'}`,
      );

      // On failure: invalidate OTP challenge & mark message log as FAILED
      await Promise.allSettled([
        this.otpService.invalidateActiveForPhone(phoneE164, options.purpose),
        this.prisma.whatsappMessageLog.update({
          where: { id: reservedLogId },
          data: {
            status: 'FAILED',
            errorCode: err instanceof WhatsappOtpError ? err.code : 'SEND_FAILED',
          },
        }),
      ]);

      if (err instanceof WhatsappOtpError) {
        if (err.code === 'INVALID_RECIPIENT') {
          throw new HttpException(
            {
              statusCode: 400,
              code: 'INVALID_RECIPIENT',
              message: 'رقم الهاتف غير مسجل في واتساب أو غير صالح',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      throw new HttpException(
        {
          statusCode: 503,
          code: 'OTP_SEND_FAILED',
          message: 'تعذر إرسال رمز التحقق عبر واتساب، يرجى المحاولة لاحقاً',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // 3. Update reserved log with providerMessageId in separate try/catch
    try {
      await this.prisma.whatsappMessageLog.update({
        where: { id: reservedLogId },
        data: {
          providerMessageId: sendResult.providerMessageId,
        },
      });
    } catch (dbErr: any) {
      this.logger.error(
        `Failed to record providerMessageId for reserved log: ${dbErr?.message || 'DB error'}`,
      );
      // Delivery succeeded! Do not cancel challenge or mark as failed.
    }

    return { providerMessageId: sendResult.providerMessageId };
  }

  /**
   * Verifies an OTP code for a phone number.
   */
  async verify(options: VerifyPhoneOtpOptions): Promise<VerifyPhoneOtpResult> {
    const raw = options.phoneE164;
    const strict = normalizePhoneStrict(raw);
    const phoneE164 = strict ? strict.e164 : raw.trim();

    const result = await this.otpService.verifyForPhone(
      phoneE164,
      options.purpose,
      options.code,
      options.userId,
    );

    if (result === 'OK') {
      return { verified: true };
    }

    if (result === 'TOO_MANY_ATTEMPTS') {
      throw new HttpException(
        {
          statusCode: 429,
          code: 'TOO_MANY_ATTEMPTS',
          message: 'تم تجاوز عدد محاولات إدخال الرمز، يرجى طلب رمز جديد',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (result === 'MISSING_OR_EXPIRED') {
      throw new HttpException(
        {
          statusCode: 400,
          code: 'MISSING_OR_EXPIRED',
          message: 'رمز التحقق غير صالح أو انتهت صلاحيته',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // INVALID
    throw new HttpException(
      {
        statusCode: 400,
        code: 'INVALID_OTP',
        message: 'رمز التحقق غير صحيح',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
