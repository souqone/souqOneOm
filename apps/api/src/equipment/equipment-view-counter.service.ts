import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
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
        // Fix 3: SADD dirty set BEFORE INCR count so flush never sees a count without a dirty entry
        await client.sadd(EQUIPMENT_VIEW_DIRTY_SET, listingId);
        await client.incr(countKey);
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
    const lockToken = randomUUID();

    if (this.redis.isReady()) {
      lockAcquired = await this.redis.setNX(
        EQUIPMENT_VIEW_LOCK_KEY,
        lockToken,
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
            // Nothing to flush for this ID; safely remove from dirty set if empty
            await this.removeDirtyIfEmpty(client, id, countKey);
            continue;
          }

          // Write DB via updateMany (does not throw if row is gone)
          await this.prisma.equipmentListing.updateMany({
            where: { id },
            data: { viewCount: { increment: delta } },
          });

          // Subtract delta using DECRBY so any views that arrived during flush are kept
          try {
            const remaining = await client.decrby(countKey, delta);
            if (remaining <= 0) {
              await this.removeDirtyIfEmpty(client, id, countKey);
            }
          } catch (decrErr: any) {
            // DB write succeeded but DECRBY failed; log at error with id and delta
            // Accepted risk: possible double count on retry
            this.logger.error(
              `DB updateMany succeeded but DECRBY failed for listing ${id} with delta ${delta}: ${decrErr?.message || decrErr}`,
            );
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
          const client = this.redis.getClient();
          if (client) {
            // Fix 2: Safe lock release using Lua script to match lockToken
            await client.eval(
              `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end`,
              1,
              EQUIPMENT_VIEW_LOCK_KEY,
              lockToken,
            );
          } else {
            await this.redis.del(EQUIPMENT_VIEW_LOCK_KEY);
          }
        } catch (err: any) {
          this.logger.warn(`Failed releasing equipment view flush lock: ${err?.message || err}`);
        }
      }
    }
  }

  /**
   * Helper to safely remove listing ID from dirty set if count is zero,
   * re-adding to dirty set if new views arrived concurrently.
   */
  private async removeDirtyIfEmpty(client: any, id: string, countKey: string): Promise<void> {
    await client.srem(EQUIPMENT_VIEW_DIRTY_SET, id);
    const postCheckStr = await client.get(countKey);
    const postCheck = parseInt(postCheckStr || '0', 10);
    if (postCheck > 0) {
      await client.sadd(EQUIPMENT_VIEW_DIRTY_SET, id);
    }
  }
}
