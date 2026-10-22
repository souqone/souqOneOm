import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RedisService } from '../../redis/redis.service';

export interface ViewCounterConfig {
  entityType: string;
  lockKey: string;
  dirtySet: string;
  countPrefix: string;
  dedupePrefix: string;
  lockTtlSeconds?: number;
  cooldownSeconds?: number;
  batchCap?: number;
}

export interface RecordViewParams {
  listingId: string;
  ownerId: string;
  status: string;
  hiddenByOwnerStatus?: boolean;
  deletedAt?: Date | null;
  viewerId?: string | null;
  viewerIp?: string | null;
}

/**
 * BaseRedisViewCounterService
 * Shared core for Redis-backed sliding-window view counting with batch flush to PostgreSQL.
 *
 * Rules:
 * 1. Viewer identity: viewerId if present, else viewerIp. If neither, do not count.
 * 2. Skip counting if viewer is the owner.
 * 3. Count only for ACTIVE, non-deleted, non-hidden public listings.
 * 4. Dedupe: setNX key `<dedupePrefix><listingId>:<viewerKey>` TTL 3600s.
 * 5. If new: INCR `<countPrefix><listingId>` and SADD `<dirtySet>`.
 * 6. Fail open: Redis errors are caught and logged at warn; never throw or fail the response.
 * 7. Scheduled flush writes atomic DB increment and safely decrements delta.
 */
export abstract class BaseRedisViewCounterService {
  protected abstract readonly logger: Logger;

  protected readonly lockTtlSeconds: number;
  protected readonly cooldownSeconds: number;
  protected readonly batchCap: number;

  constructor(
    protected readonly redis: RedisService,
    protected readonly config: ViewCounterConfig,
  ) {
    this.lockTtlSeconds = config.lockTtlSeconds ?? 55;
    this.cooldownSeconds = config.cooldownSeconds ?? 3600;
    this.batchCap = config.batchCap ?? 500;
  }

  async recordView(params: RecordViewParams): Promise<boolean> {
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

      const dedupeKey = `${this.config.dedupePrefix}${listingId}:${viewerKey}`;
      const isNew = await this.redis.setNX(dedupeKey, '1', this.cooldownSeconds);

      if (!isNew) {
        return false;
      }

      const countKey = `${this.config.countPrefix}${listingId}`;
      const client = this.redis.getClient();

      if (client) {
        // SADD dirty set BEFORE INCR count so flush never sees a count without a dirty entry
        await client.sadd(this.config.dirtySet, listingId);
        await client.incr(countKey);
      } else {
        await this.redis.incr(countKey);
      }

      return true;
    } catch (err: any) {
      this.logger.warn(`Failed recording ${this.config.entityType} view for ${listingId}: ${err?.message || err}`);
      return false;
    }
  }

  async getPendingDelta(listingId: string): Promise<number> {
    try {
      if (!this.redis.isReady()) return 0;
      const countKey = `${this.config.countPrefix}${listingId}`;
      const client = this.redis.getClient();
      if (!client) return 0;
      const val = await client.get(countKey);
      const parsed = parseInt(val || '0', 10);
      return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
    } catch {
      return 0;
    }
  }

  protected async flushViewsCore(
    updateDbBatch: (id: string, delta: number) => Promise<any>,
  ): Promise<{
    flushedCount: number;
    failedCount: number;
    skippedDueToLock?: boolean;
  }> {
    let lockAcquired = false;
    const lockToken = randomUUID();

    if (this.redis.isReady()) {
      lockAcquired = await this.redis.setNX(
        this.config.lockKey,
        lockToken,
        this.lockTtlSeconds,
      );

      if (!lockAcquired) {
        this.logger.debug(`${this.constructor.name}: another replica holds the lock, skipping flush`);
        return { flushedCount: 0, failedCount: 0, skippedDueToLock: true };
      }
    } else {
      this.logger.warn(`${this.constructor.name}: Redis is not ready, skipping view flush`);
      return { flushedCount: 0, failedCount: 0 };
    }

    let flushedCount = 0;
    let failedCount = 0;

    try {
      const client = this.redis.getClient();
      if (!client) return { flushedCount: 0, failedCount: 0 };

      // Read up to BATCH_CAP dirty listing IDs
      const dirtyIds = await client.smembers(this.config.dirtySet);
      if (!dirtyIds || dirtyIds.length === 0) {
        return { flushedCount: 0, failedCount: 0 };
      }

      const idsToProcess = dirtyIds.slice(0, this.batchCap);

      for (const id of idsToProcess) {
        try {
          const countKey = `${this.config.countPrefix}${id}`;
          const currentDeltaStr = await client.get(countKey);
          const delta = parseInt(currentDeltaStr || '0', 10);

          if (!delta || delta <= 0) {
            await this.removeDirtyIfEmpty(client, id, countKey);
            continue;
          }

          // Atomic DB update
          await updateDbBatch(id, delta);

          // Subtract delta using DECRBY so any views that arrived during flush are kept
          try {
            const remaining = await client.decrby(countKey, delta);
            if (remaining <= 0) {
              await this.removeDirtyIfEmpty(client, id, countKey);
            }
          } catch (decrErr: any) {
            this.logger.error(
              `DB update succeeded but DECRBY failed for ${this.config.entityType} ${id} with delta ${delta}: ${decrErr?.message || decrErr}`,
            );
          }

          flushedCount++;
        } catch (err: any) {
          failedCount++;
          this.logger.error(`Failed flushing view count for ${this.config.entityType} ${id}: ${err?.message || err}`);
        }
      }

      return { flushedCount, failedCount };
    } finally {
      if (lockAcquired) {
        try {
          const client = this.redis.getClient();
          if (client) {
            // Safe lock release using Lua script to match lockToken
            await client.eval(
              `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end`,
              1,
              this.config.lockKey,
              lockToken,
            );
          } else {
            await this.redis.del(this.config.lockKey);
          }
        } catch (err: any) {
          this.logger.warn(`Failed releasing ${this.config.entityType} view flush lock: ${err?.message || err}`);
        }
      }
    }
  }

  private async removeDirtyIfEmpty(client: any, id: string, countKey: string): Promise<void> {
    await client.srem(this.config.dirtySet, id);
    const postCheckStr = await client.get(countKey);
    const postCheck = parseInt(postCheckStr || '0', 10);
    if (postCheck > 0) {
      await client.sadd(this.config.dirtySet, id);
    }
  }
}
