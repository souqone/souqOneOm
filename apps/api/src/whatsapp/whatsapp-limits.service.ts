import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { OtpPurpose, Prisma } from '@prisma/client';
import { getAuthPepper } from '../config/pepper.config';

export function hashToBigInt(hexHash: string): bigint {
  return BigInt('0x' + hexHash.slice(0, 15));
}

export const WHATSAPP_GLOBAL_LOCK_KEY = BigInt('0x534f55514f4e45');

export interface ReserveSendSlotOptions {
  phoneE164: string;
  purpose: OtpPurpose;
  ip?: string;
}

export interface ReservedSlotResult {
  reservedLogId: string;
  phoneHash: string;
  ipHash: string | null;
}

@Injectable()
export class WhatsappLimitsService {
  private readonly logger = new Logger(WhatsappLimitsService.name);
  private lastWarnedUtcDay: string | null = null;


  hashPhone(phoneE164: string): string {
    const pepper = getAuthPepper();
    return crypto
      .createHmac('sha256', pepper)
      .update(`phone:${phoneE164}`)
      .digest('hex');
  }

  hashIp(ip: string): string {
    const pepper = getAuthPepper();
    return crypto
      .createHmac('sha256', pepper)
      .update(`ip:${ip}`)
      .digest('hex');
  }

  getDailyCap(): number {
    const envCap = parseInt(process.env.WHATSAPP_DAILY_CAP || '200', 10);
    return Number.isFinite(envCap) && envCap > 0 ? envCap : 200;
  }

  /**
   * Reserves a WhatsApp send slot inside an active Prisma transaction under advisory locks.
   * Performs all rate-limiting checks (cooldown, 10m, 24h, IP 1h, IP 24h, global daily cap)
   * and creates a reserved record in `whatsapp_message_logs` with status 'ACCEPTED'.
   */
  async reserveSendSlot(
    tx: Prisma.TransactionClient,
    options: ReserveSendSlotOptions,
  ): Promise<ReservedSlotResult> {
    const now = new Date();
    const pHash = this.hashPhone(options.phoneE164);
    const iHash = options.ip ? this.hashIp(options.ip) : null;

    // 1. Acquire transaction-level advisory locks in deterministic order to prevent race conditions & deadlocks
    const phoneLockKey = hashToBigInt(pHash);
    const lockKeys: bigint[] = [phoneLockKey, WHATSAPP_GLOBAL_LOCK_KEY];
    if (iHash) {
      const ipLockKey = hashToBigInt(iHash);
      if (!lockKeys.includes(ipLockKey)) {
        lockKeys.push(ipLockKey);
      }
    }
    const uniqueSortedKeys = Array.from(new Set(lockKeys)).sort((a, b) =>
      a < b ? -1 : a > b ? 1 : 0,
    );

    for (const key of uniqueSortedKeys) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${key}::bigint)`;
    }

    // 2. Cooldown check: 60 seconds between messages for the same phone
    const latestLog = await tx.whatsappMessageLog.findFirst({
      where: { phoneHash: pHash },
      orderBy: { createdAt: 'desc' },
    });

    if (latestLog) {
      const elapsedMs = now.getTime() - latestLog.createdAt.getTime();
      if (elapsedMs < 60_000) {
        const retryAfterSeconds = Math.ceil((60_000 - elapsedMs) / 1000);
        throw new HttpException(
          {
            statusCode: 429,
            code: 'OTP_COOLDOWN',
            message: 'يرجى الانتظار قبل طلب رمز تحقق جديد',
            retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 3. Phone 10-minute limit: max 3 messages
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const countTenMinutes = await tx.whatsappMessageLog.count({
      where: {
        phoneHash: pHash,
        createdAt: { gte: tenMinutesAgo },
      },
    });

    if (countTenMinutes >= 3) {
      throw new HttpException(
        {
          statusCode: 429,
          code: 'OTP_RATE_LIMITED',
          message: 'تم تجاوز الحد المسموح لطلب الرموز، يرجى المحاولة لاحقاً',
          retryAfterSeconds: 600,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 4. Phone 24-hour limit: max 10 messages
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const countTwentyFourHours = await tx.whatsappMessageLog.count({
      where: {
        phoneHash: pHash,
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    if (countTwentyFourHours >= 10) {
      throw new HttpException(
        {
          statusCode: 429,
          code: 'OTP_RATE_LIMITED',
          message: 'تم تجاوز الحد اليومي لطلب الرموز لهذا الرقم',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 5. IP limits (if IP is provided)
    if (iHash) {
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const ipCountOneHour = await tx.whatsappMessageLog.count({
        where: {
          ipHash: iHash,
          createdAt: { gte: oneHourAgo },
        },
      });

      if (ipCountOneHour >= 10) {
        throw new HttpException(
          {
            statusCode: 429,
            code: 'OTP_RATE_LIMITED',
            message: 'تم تجاوز الحد المسموح لعنوان الإنترنت الخاص بك',
            retryAfterSeconds: 3600,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const ipCountTwentyFourHours = await tx.whatsappMessageLog.count({
        where: {
          ipHash: iHash,
          createdAt: { gte: twentyFourHoursAgo },
        },
      });

      if (ipCountTwentyFourHours >= 30) {
        throw new HttpException(
          {
            statusCode: 429,
            code: 'OTP_RATE_LIMITED',
            message: 'تم تجاوز الحد اليومي لعنوان الإنترنت الخاص بك',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 6. Global daily cap (evaluated in UTC day)
    const startOfUtcDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
    );
    const globalCountToday = await tx.whatsappMessageLog.count({
      where: {
        createdAt: { gte: startOfUtcDay },
      },
    });

    const dailyCap = this.getDailyCap();
    if (globalCountToday >= dailyCap) {
      throw new HttpException(
        {
          statusCode: 429,
          code: 'OTP_DAILY_CAP_REACHED',
          message: 'تم بلوغ السقف اليومي لخدمة الرسائل، يرجى المحاولة غداً',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 7. Warn at 80% of daily cap (once per UTC day)
    const warningThreshold = Math.floor(dailyCap * 0.8);
    if (globalCountToday >= warningThreshold) {
      const currentUtcDayStr = startOfUtcDay.toISOString().slice(0, 10);
      if (this.lastWarnedUtcDay !== currentUtcDayStr) {
        this.lastWarnedUtcDay = currentUtcDayStr;
        this.logger.warn(
          `WhatsApp daily OTP usage reached 80% threshold (${globalCountToday}/${dailyCap}) for ${currentUtcDayStr}`,
        );
      }
    }

    // 8. Atomically reserve slot in DB
    const reserved = await tx.whatsappMessageLog.create({
      data: {
        phoneHash: pHash,
        purpose: options.purpose,
        ipHash: iHash,
        status: 'ACCEPTED',
        providerMessageId: null,
      },
    });

    return {
      reservedLogId: reserved.id,
      phoneHash: pHash,
      ipHash: iHash,
    };
  }
}
