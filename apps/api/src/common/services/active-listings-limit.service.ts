import {
  Injectable,
  HttpException,
  HttpStatus,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';

export const TIMEZONE = 'Africa/Cairo';

export const DEFAULT_MAX_DAILY_PUBLISHES = 20;
export const DEFAULT_MAX_MONTHLY_PUBLISHES = 300;

export const PUBLISH_RATE_LIMIT_DAILY_CODE = 'PUBLISH_RATE_LIMIT_DAILY_REACHED';
export const PUBLISH_RATE_LIMIT_MONTHLY_CODE = 'PUBLISH_RATE_LIMIT_MONTHLY_REACHED';

// Deprecated legacy symbols kept for backward compatibility if imported elsewhere
export const DEFAULT_MAX_ACTIVE_LISTINGS = 5;
export const ACTIVE_LISTINGS_LIMIT_REACHED_CODE = 'ACTIVE_LISTINGS_LIMIT_REACHED';
export const ACTIVE_LISTINGS_LIMIT_REACHED_MESSAGE =
  'لقد بلغت الحد الأقصى للإعلانات النشطة. يرجى حذف أحد إعلاناتك أو إيقافه ثم المحاولة مرة أخرى.';

export type ListingVertical =
  | 'cars'
  | 'buses'
  | 'equipment'
  | 'parts'
  | 'services'
  | 'jobs'
  | 'operators';

export const ALL_LISTING_VERTICALS: ListingVertical[] = [
  'cars',
  'buses',
  'equipment',
  'parts',
  'services',
  'jobs',
  'operators',
];

export interface RateLimitWindows {
  startOfDay: Date;
  startOfMonth: Date;
  resetDay: Date;
  resetMonth: Date;
}

export function hashToBigInt(hexHash: string): bigint {
  return BigInt('0x' + hexHash.slice(0, 15));
}

/**
 * Calculates start and reset timestamps for daily and monthly rate limit windows
 * in the Africa/Cairo calendar timezone.
 */
export function getCairoWindows(now = new Date()): RateLimitWindows {
  const cairoDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); // "YYYY-MM-DD"

  const [yStr, mStr, dStr] = cairoDateStr.split('-');
  const y = Number(yStr);
  const m = Number(mStr);

  function getCairoTime(dateStr: string, timeStr = '00:00:00'): Date {
    const approx = new Date(`${dateStr}T${timeStr}Z`);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE,
      hour: 'numeric',
      hour12: false,
    }).formatToParts(approx);
    const hour = Number(parts.find((p) => p.type === 'hour')!.value);
    const targetHour = Number(timeStr.split(':')[0]);
    let diff = hour - targetHour;
    if (diff > 12) diff -= 24;
    if (diff < -12) diff += 24;
    return new Date(approx.getTime() - diff * 3600 * 1000);
  }

  const startOfDay = getCairoTime(`${yStr}-${mStr}-${dStr}`);
  const startOfMonth = getCairoTime(`${yStr}-${mStr}-01`);

  const nextDayDate = new Date(startOfDay.getTime() + 25 * 3600 * 1000);
  const nextDayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(nextDayDate);
  const resetDay = getCairoTime(nextDayStr);

  const nextMonthY = m === 12 ? y + 1 : y;
  const nextMonthM = m === 12 ? '01' : String(m + 1).padStart(2, '0');
  const resetMonth = getCairoTime(`${nextMonthY}-${nextMonthM}-01`);

  return { startOfDay, startOfMonth, resetDay, resetMonth };
}

@Injectable()
export class ActiveListingsLimitService {
  private readonly logger = new Logger(ActiveListingsLimitService.name);

  getMaxDailyPublishes(): number {
    const rawVal =
      process.env.MAX_DAILY_PUBLISHES_PER_SECTION || process.env.MAX_PUBLISHES_PER_DAY;
    if (rawVal === undefined || rawVal.trim() === '') {
      return DEFAULT_MAX_DAILY_PUBLISHES;
    }
    const parsed = parseInt(rawVal.trim(), 10);
    if (isNaN(parsed) || parsed <= 0) {
      this.logger.warn(
        `Invalid daily publish limit value "${rawVal}". Defaulting to ${DEFAULT_MAX_DAILY_PUBLISHES}.`,
      );
      return DEFAULT_MAX_DAILY_PUBLISHES;
    }
    return parsed;
  }

  getMaxMonthlyPublishes(): number {
    const rawVal =
      process.env.MAX_MONTHLY_PUBLISHES_PER_SECTION || process.env.MAX_PUBLISHES_PER_MONTH;
    if (rawVal === undefined || rawVal.trim() === '') {
      return DEFAULT_MAX_MONTHLY_PUBLISHES;
    }
    const parsed = parseInt(rawVal.trim(), 10);
    if (isNaN(parsed) || parsed <= 0) {
      this.logger.warn(
        `Invalid monthly publish limit value "${rawVal}". Defaulting to ${DEFAULT_MAX_MONTHLY_PUBLISHES}.`,
      );
      return DEFAULT_MAX_MONTHLY_PUBLISHES;
    }
    return parsed;
  }

  /**
   * @deprecated The legacy 5-active listings cap across verticals was completely removed in D-223.
   * This stub returns getMaxDailyPublishes() solely for backward compatibility with any legacy test references.
   * No production callers or services should rely on an active listing count.
   */
  getMaxActiveListings(): number {
    return this.getMaxDailyPublishes();
  }

  private async countSectionPublishes(
    tx: Prisma.TransactionClient,
    vertical: ListingVertical,
    userId: string,
    since: Date,
  ): Promise<number> {
    switch (vertical) {
      case 'cars':
        return tx.listing.count({ where: { sellerId: userId, createdAt: { gte: since } } });
      case 'buses':
        return tx.busListing.count({ where: { userId, createdAt: { gte: since } } });
      case 'equipment':
        return tx.equipmentListing.count({ where: { userId, createdAt: { gte: since } } });
      case 'parts':
        return tx.sparePart.count({ where: { sellerId: userId, createdAt: { gte: since } } });
      case 'services':
        return tx.carService.count({ where: { userId, createdAt: { gte: since } } });
      case 'jobs':
        return tx.driverJob.count({ where: { userId, createdAt: { gte: since } } });
      case 'operators':
        return tx.operatorListing.count({ where: { userId, createdAt: { gte: since } } });
      default:
        return 0;
    }
  }

  async assertWithinLimit(
    userId: string,
    tx: Prisma.TransactionClient,
    vertical?: ListingVertical | string,
  ): Promise<void> {
    // 1. Role exemption: ADMIN and MODERATOR are exempt from publish limits
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true, deletionScheduledAt: true },
    });
    if (user?.role === 'ADMIN' || user?.role === 'MODERATOR') {
      return;
    }

    // 2. Account deletion scheduled check: non-admin scheduled accounts cannot publish
    if (user?.deletionScheduledAt != null) {
      throw new ForbiddenException(
        'الحساب مجدول للحذف. يرجى إلغاء طلب الحذف أولاً لاستئناف نشر أو تفعيل الإعلانات.',
      );
    }

    // 3. Transactional advisory lock per user: serializes concurrent publishes
    const lockKey = hashToBigInt(
      crypto.createHash('sha256').update(`publish_rate_limit:${userId}`).digest('hex'),
    );
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey}::bigint)`;

    // 4. Rate windows in Africa/Cairo calendar day and calendar month
    const windows = getCairoWindows();
    const dailyLimit = this.getMaxDailyPublishes();
    const monthlyLimit = this.getMaxMonthlyPublishes();

    const sectionsToCheck: ListingVertical[] = vertical
      ? [vertical as ListingVertical]
      : ALL_LISTING_VERTICALS;

    for (const section of sectionsToCheck) {
      // Check daily rate limit
      const dailyCount = await this.countSectionPublishes(tx, section, userId, windows.startOfDay);
      if (dailyCount >= dailyLimit) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            code: PUBLISH_RATE_LIMIT_DAILY_CODE,
            message: `لقد بلغت الحد الأقصى للنشر اليومي في هذا القسم (${dailyLimit} إعلان). يتجدد الحد غداً في تمام الساعة 12:00 منتصف الليل.`,
            window: 'DAILY',
            vertical: section,
            limit: dailyLimit,
            currentCount: dailyCount,
            resetsAt: windows.resetDay.toISOString(),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Check monthly rate limit
      const monthlyCount = await this.countSectionPublishes(tx, section, userId, windows.startOfMonth);
      if (monthlyCount >= monthlyLimit) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            code: PUBLISH_RATE_LIMIT_MONTHLY_CODE,
            message: `لقد بلغت الحد الأقصى للنشر الشهري في هذا القسم (${monthlyLimit} إعلان). يتجدد الحد مع بداية الشهر القادم.`,
            window: 'MONTHLY',
            vertical: section,
            limit: monthlyLimit,
            currentCount: monthlyCount,
            resetsAt: windows.resetMonth.toISOString(),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }
}
