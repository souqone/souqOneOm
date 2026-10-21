import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

export const EQUIPMENT_VIEW_LOCK_KEY = 'lock:equipment-view-flush';
export const EQUIPMENT_VIEW_LOCK_TTL_SECONDS = 55; // Under 1 minute
export const EQUIPMENT_VIEW_DIRTY_SET = 'viewcount:equipment:dirty';
export const EQUIPMENT_VIEW_COUNT_PREFIX = 'viewcount:equipment:';
export const EQUIPMENT_VIEW_DEDUPE_PREFIX = 'view:equipment:';
export const EQUIPMENT_VIEW_COOLDOWN_SECONDS = 3600; // 1 hour
export const EQUIPMENT_VIEW_FLUSH_BATCH_CAP = 500;

export interface RecordEquipmentViewParams {
  listingId: string;
  ownerId: string;
  status: string;
  hiddenByOwnerStatus?: boolean;
  deletedAt?: Date | null;
  viewerId?: string | null;
  viewerIp?: string | null;
}

@Injectable()
export class EquipmentViewCounterService {
  private readonly logger = new Logger(EquipmentViewCounterService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Records a view for an equipment listing with Redis-backed deduplication.
   *
   * Rules:
   * 1. Viewer identity: viewerId if present, else viewerIp. If neither, do not count.
   * 2. Skip counting if viewer is the owner.
   * 3. Count only for ACTIVE, non-deleted, non-hidden public listings.
   * 4. Dedupe: setNX key `view:equipment:<listingId>:<viewerKey>` TTL 3600s.
   * 5. If new: INCR `viewcount:equipment:<listingId>` and SADD `viewcount:equipment:dirty`.
   * 6. Fail open: Redis errors are caught and logged at warn; never throw or fail the response.
   */
  async recordView(params: RecordEquipmentViewParams): Promise<boolean> {
    const {
      listingId,
      ownerId,
      status,
      hiddenByOwnerStatus,
      deletedAt,
      viewerId,
      viewerIp,
    } = params;

    // Gate 1: Check listing public status
    if (status !== 'ACTIVE' || hiddenByOwnerStatus === true || deletedAt != null) {
      return false;
    }

    // Gate 2: Viewer identity
    const viewerKey = viewerId || viewerIp;
    if (!viewerKey) {
      return false;
    }

    // Gate 3: Owner view is not counted
    if (viewerId && viewerId === ownerId) {
      return false;
    }

    // Gate 4: Redis readiness check
    try {
      if (!this.redis.isReady()) {
        return false;
      }

      const dedupeKey = `${EQUIPMENT_VIEW_DEDUPE_PREFIX}${listingId}:${viewerKey}`;
      const isNew = await this.redis.setNX(dedupeKey, '1', EQUIPMENT_VIEW_COOLDOWN_SECONDS);

      if (!isNew) {
        return false;
      }

      const countKey = `${EQUIPMENT_VIEW_COUNT_PREFIX}${listingId}`;
      const client = this.redis.getClient();

      if (client) {
        await Promise.all([
          client.incr(countKey),
          client.sadd(EQUIPMENT_VIEW_DIRTY_SET, listingId),
        ]);
      } else {
        await this.redis.incr(countKey);
      }

      return true;
    } catch (err: any) {
      this.logger.warn(`Failed recording equipment view for ${listingId}: ${err?.message || err}`);
      return false;
    }
  }

  /**
   * Optional helper to fetch pending delta from Redis for real-time reads.
   * Returns 0 if Redis is unavailable or on error.
   */
  async getPendingDelta(listingId: string): Promise<number> {
    try {
      if (!this.redis.isReady()) return 0;
      const countKey = `${EQUIPMENT_VIEW_COUNT_PREFIX}${listingId}`;
      const client = this.redis.getClient();
      if (!client) return 0;
      const val = await client.get(countKey);
      const parsed = parseInt(val || '0', 10);
      return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
    } catch {
      return 0;
    }
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
    let lockAcquired = false;

    if (this.redis.isReady()) {
      lockAcquired = await this.redis.setNX(
        EQUIPMENT_VIEW_LOCK_KEY,
        'locked',
        EQUIPMENT_VIEW_LOCK_TTL_SECONDS,
      );

      if (!lockAcquired) {
        this.logger.debug('EquipmentViewCounterService: another replica holds the lock, skipping flush');
        return { flushedCount: 0, failedCount: 0, skippedDueToLock: true };
      }
    } else {
      this.logger.warn('EquipmentViewCounterService: Redis is not ready, skipping view flush');
      return { flushedCount: 0, failedCount: 0 };
    }

    let flushedCount = 0;
    let failedCount = 0;

    try {
      const client = this.redis.getClient();
      if (!client) return { flushedCount: 0, failedCount: 0 };

      // Read up to BATCH_CAP dirty listing IDs
      // Using SMEMBERS or SRANDMEMBER/SPOP. To be safe, read members then cap.
      const dirtyIds = await client.smembers(EQUIPMENT_VIEW_DIRTY_SET);
      if (!dirtyIds || dirtyIds.length === 0) {
        return { flushedCount: 0, failedCount: 0 };
      }

      const idsToProcess = dirtyIds.slice(0, EQUIPMENT_VIEW_FLUSH_BATCH_CAP);

      for (const id of idsToProcess) {
        try {
          const countKey = `${EQUIPMENT_VIEW_COUNT_PREFIX}${id}`;
          const currentDeltaStr = await client.get(countKey);
          const delta = parseInt(currentDeltaStr || '0', 10);

          if (!delta || delta <= 0) {
            // Nothing to flush for this ID; remove from dirty set
            await client.srem(EQUIPMENT_VIEW_DIRTY_SET, id);
            continue;
          }

          // Write DB via updateMany (does not throw if row is gone)
          await this.prisma.equipmentListing.updateMany({
            where: { id },
            data: { viewCount: { increment: delta } },
          });

          // Subtract delta using DECRBY so any views that arrived during flush are kept
          const remaining = await client.decrby(countKey, delta);
          if (remaining <= 0) {
            // Clean up key if at zero (or negative due to edge cases)
            await client.del(countKey);
            await client.srem(EQUIPMENT_VIEW_DIRTY_SET, id);
          } else {
            // More views arrived; keep in dirty set for next run
          }

          flushedCount++;
        } catch (err: any) {
          failedCount++;
          this.logger.error(`Failed flushing view count for equipment ${id}: ${err?.message || err}`);
          // On DB failure, keep the delta in Redis and do NOT remove from dirty set
        }
      }

      return { flushedCount, failedCount };
    } finally {
      if (lockAcquired) {
        try {
          await this.redis.del(EQUIPMENT_VIEW_LOCK_KEY);
        } catch (err: any) {
          this.logger.warn(`Failed releasing equipment view flush lock: ${err?.message || err}`);
        }
      }
    }
  }
}
