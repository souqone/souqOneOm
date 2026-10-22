import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BaseRedisViewCounterService,
  RecordViewParams,
} from '../common/services/base-view-counter.service';

export const OPERATOR_VIEW_LOCK_KEY = 'lock:operator-view-flush';
export const OPERATOR_VIEW_LOCK_TTL_SECONDS = 55; // Under 1 minute
export const OPERATOR_VIEW_DIRTY_SET = 'viewcount:operator:dirty';
export const OPERATOR_VIEW_COUNT_PREFIX = 'viewcount:operator:';
export const OPERATOR_VIEW_DEDUPE_PREFIX = 'view:operator:';
export const OPERATOR_VIEW_COOLDOWN_SECONDS = 3600; // 1 hour
export const OPERATOR_VIEW_FLUSH_BATCH_CAP = 500;

export type RecordOperatorViewParams = RecordViewParams;

@Injectable()
export class OperatorViewCounterService extends BaseRedisViewCounterService {
  protected readonly logger = new Logger(OperatorViewCounterService.name);

  constructor(
    redis: RedisService,
    private readonly prisma: PrismaService,
  ) {
    super(redis, {
      entityType: 'operator',
      lockKey: OPERATOR_VIEW_LOCK_KEY,
      dirtySet: OPERATOR_VIEW_DIRTY_SET,
      countPrefix: OPERATOR_VIEW_COUNT_PREFIX,
      dedupePrefix: OPERATOR_VIEW_DEDUPE_PREFIX,
      lockTtlSeconds: OPERATOR_VIEW_LOCK_TTL_SECONDS,
      cooldownSeconds: OPERATOR_VIEW_COOLDOWN_SECONDS,
      batchCap: OPERATOR_VIEW_FLUSH_BATCH_CAP,
    });
  }

  /**
   * Periodic flush cron executing every minute ('* * * * *').
   * Flushes Redis pending counts to PostgreSQL operatorListing table.
   */
  @Cron('* * * * *')
  async flushViews(): Promise<{
    flushedCount: number;
    failedCount: number;
    skippedDueToLock?: boolean;
  }> {
    return this.flushViewsCore((id, delta) =>
      this.prisma.operatorListing.updateMany({
        where: { id },
        data: { viewCount: { increment: delta } },
      }),
    );
  }
}
