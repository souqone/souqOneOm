import {
  Injectable,
  HttpException,
  HttpStatus,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';

export const DEFAULT_MAX_ACTIVE_LISTINGS = 5;
export const ACTIVE_LISTINGS_LIMIT_REACHED_CODE = 'ACTIVE_LISTINGS_LIMIT_REACHED';
export const ACTIVE_LISTINGS_LIMIT_REACHED_MESSAGE =
  'لقد بلغت الحد الأقصى للإعلانات النشطة. يرجى حذف أحد إعلاناتك أو إيقافه ثم المحاولة مرة أخرى.';

export function hashToBigInt(hexHash: string): bigint {
  return BigInt('0x' + hexHash.slice(0, 15));
}

@Injectable()
export class ActiveListingsLimitService {
  private readonly logger = new Logger(ActiveListingsLimitService.name);

  getMaxActiveListings(): number {
    const rawVal = process.env.MAX_ACTIVE_LISTINGS_PER_USER;
    if (rawVal === undefined || rawVal.trim() === '') {
      return DEFAULT_MAX_ACTIVE_LISTINGS;
    }
    const parsed = parseInt(rawVal.trim(), 10);
    if (isNaN(parsed) || parsed <= 0) {
      this.logger.warn(
        `Invalid MAX_ACTIVE_LISTINGS_PER_USER value "${rawVal}". Defaulting to ${DEFAULT_MAX_ACTIVE_LISTINGS}.`,
      );
      return DEFAULT_MAX_ACTIVE_LISTINGS;
    }
    return parsed;
  }

  async assertWithinLimit(
    userId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    // 1. Role exemption: ADMIN and MODERATOR are exempt from active listings limit
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true, deletionScheduledAt: true },
    });
    if (user?.role === 'ADMIN' || user?.role === 'MODERATOR') {
      return;
    }

    // 2. Account deletion scheduled check: non-admin scheduled accounts cannot publish or activate ads
    if (user?.deletionScheduledAt != null) {
      throw new ForbiddenException(
        'الحساب مجدول للحذف. يرجى إلغاء طلب الحذف أولاً لاستئناف نشر أو تفعيل الإعلانات.',
      );
    }

    // 3. Transactional advisory lock per user: serializes concurrent creations/activations
    const lockKey = hashToBigInt(
      crypto.createHash('sha256').update(`active_ads_cap:${userId}`).digest('hex'),
    );
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey}::bigint)`;

    // 4. Count public active listings across all 7 verticals
    const [cars, buses, equipment, parts, services, jobs, operators] =
      await Promise.all([
        tx.listing.count({
          where: { sellerId: userId, status: 'ACTIVE', hiddenByOwnerStatus: false },
        }),
        tx.busListing.count({
          where: {
            userId,
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
            deletedAt: null,
          },
        }),
        tx.equipmentListing.count({
          where: {
            userId,
            status: 'ACTIVE',
            hiddenByOwnerStatus: false,
            deletedAt: null,
          },
        }),
        tx.sparePart.count({
          where: { sellerId: userId, status: 'ACTIVE', hiddenByOwnerStatus: false, deletedAt: null },
        }),
        tx.carService.count({
          where: { userId, status: 'ACTIVE', hiddenByOwnerStatus: false, deletedAt: null },
        }),
        tx.driverJob.count({
          where: { userId, status: 'ACTIVE', hiddenByOwnerStatus: false },
        }),
        tx.operatorListing.count({
          where: { userId, status: 'ACTIVE', hiddenByOwnerStatus: false },
        }),
      ]);

    const activeCount =
      cars + buses + equipment + parts + services + jobs + operators;

    const limit = this.getMaxActiveListings();
    if (activeCount >= limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          code: ACTIVE_LISTINGS_LIMIT_REACHED_CODE,
          message: ACTIVE_LISTINGS_LIMIT_REACHED_MESSAGE,
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
