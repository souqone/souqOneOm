import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BaseRedisViewCounterService,
  RecordViewParams,
} from '../common/services/base-view-counter.service';

export const EQUIPMENT_VIEW_LOCK_KEY = 'lock:equipment-view-flush';
export const EQUIPMENT_VIEW_LOCK_TTL_SECONDS = 55; // Under 1 minute
export const EQUIPMENT_VIEW_DIRTY_SET = 'viewcount:equipment:dirty';
export const EQUIPMENT_VIEW_COUNT_PREFIX = 'viewcount:equipment:';
export const EQUIPMENT_VIEW_DEDUPE_PREFIX = 'view:equipment:';
export const EQUIPMENT_VIEW_COOLDOWN_SECONDS = 3600; // 1 hour
export const EQUIPMENT_VIEW_FLUSH_BATCH_CAP = 500;

export type RecordEquipmentViewParams = RecordViewParams;

@Injectable()
export class EquipmentViewCounterService extends BaseRedisViewCounterService {
  protected readonly logger = new Logger(EquipmentViewCounterService.name);

  constructor(
    redis: RedisService,
    private readonly prisma: PrismaService,
  ) {
    super(redis, {
      entityType: 'equipment',
      lockKey: EQUIPMENT_VIEW_LOCK_KEY,
      dirtySet: EQUIPMENT_VIEW_DIRTY_SET,
      countPrefix: EQUIPMENT_VIEW_COUNT_PREFIX,
      dedupePrefix: EQUIPMENT_VIEW_DEDUPE_PREFIX,
      lockTtlSeconds: EQUIPMENT_VIEW_LOCK_TTL_SECONDS,
      cooldownSeconds: EQUIPMENT_VIEW_COOLDOWN_SECONDS,
      batchCap: EQUIPMENT_VIEW_FLUSH_BATCH_CAP,
    });
  }

  /**
   * Periodic flush cron executing every minute ('* * * * *').
   * Flushes Redis pending counts to PostgreSQL.
   */
  @Cron('* * * * *')
  async flushViews(): Promise<{
    flushedCount: number;
    failedCount: number;
    skippedDueToLock?: boolean;
  }> {
    return this.flushViewsCore((id, delta) =>
      this.prisma.equipmentListing.updateMany({
        where: { id },
        data: { viewCount: { increment: delta } },
      }),
    );
  }
}
