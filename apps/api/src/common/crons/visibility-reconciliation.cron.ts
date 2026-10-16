import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { OwnerContentVisibilityService } from '../services/owner-content-visibility.service';
import { OWNER_VISIBILITY_REGISTRY } from '../constants/owner-visibility.registry';

export const RECONCILIATION_MAX_OWNERS = 200;
export const RECONCILIATION_LOCK_KEY = 'lock:visibility-reconciliation';
export const RECONCILIATION_LOCK_TTL_SECONDS = 240; // 4 minutes

@Injectable()
export class VisibilityReconciliationCron {
  private readonly logger = new Logger(VisibilityReconciliationCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly visibilityService: OwnerContentVisibilityService,
  ) {}

  /**
   * Periodic reconciliation cron executing every 5 minutes.
   * Protects against multi-replica overlap using Redis distributed lock.
   * Finds up to 200 owners whose entity visibility mismatches their User status.
   *
   * Mismatch types:
   * (a) Entity hiddenByOwnerStatus = false, but owner status != ACTIVE -> hideAllForUser
   * (b) Entity hiddenByOwnerStatus = true, but owner status = ACTIVE -> restoreAllForUser
   */
  @Cron('*/5 * * * *')
  async reconcile(): Promise<{
    hiddenOwnersCount: number;
    restoredOwnersCount: number;
    skippedDueToLock?: boolean;
  }> {
    const lockAcquired = await this.redis.setNX(
      RECONCILIATION_LOCK_KEY,
      'locked',
      RECONCILIATION_LOCK_TTL_SECONDS,
    );

    if (!lockAcquired) {
      this.logger.debug(
        'VisibilityReconciliationCron: another replica holds the lock, skipping this run',
      );
      return { hiddenOwnersCount: 0, restoredOwnersCount: 0, skippedDueToLock: true };
    }

    try {
      this.logger.log('Starting visibility reconciliation scan...');

      const ownersToHide = new Set<string>();
      const ownersToRestore = new Set<string>();

      // ─── (A) Scan for misaligned content that SHOULD be hidden ─────────────
      for (const config of OWNER_VISIBILITY_REGISTRY) {
        if (ownersToHide.size >= RECONCILIATION_MAX_OWNERS) break;

        const delegate = (this.prisma as any)[config.prismaDelegate];
        if (!delegate || typeof delegate.findMany !== 'function') continue;

        const records = await delegate.findMany({
          where: {
            hiddenByOwnerStatus: false,
            [config.ownerRelation]: {
              status: { not: 'ACTIVE' },
            },
          },
          select: { [config.ownerField]: true },
          take: RECONCILIATION_MAX_OWNERS - ownersToHide.size,
        });

        for (const record of records) {
          const ownerId = record[config.ownerField];
          if (ownerId) {
            ownersToHide.add(ownerId);
            if (ownersToHide.size >= RECONCILIATION_MAX_OWNERS) break;
          }
        }
      }

      // ─── (B) Scan for misaligned content that SHOULD be restored ───────────
      const remainingQuota = RECONCILIATION_MAX_OWNERS - ownersToHide.size;
      if (remainingQuota > 0) {
        for (const config of OWNER_VISIBILITY_REGISTRY) {
          if (ownersToRestore.size >= remainingQuota) break;

          const delegate = (this.prisma as any)[config.prismaDelegate];
          if (!delegate || typeof delegate.findMany !== 'function') continue;

          const records = await delegate.findMany({
            where: {
              hiddenByOwnerStatus: true,
              [config.ownerRelation]: {
                status: 'ACTIVE',
              },
            },
            select: { [config.ownerField]: true },
            take: remainingQuota - ownersToRestore.size,
          });

          for (const record of records) {
            const ownerId = record[config.ownerField];
            // If already queued to hide in this run, do not restore
            if (ownerId && !ownersToHide.has(ownerId)) {
              ownersToRestore.add(ownerId);
              if (ownersToRestore.size >= remainingQuota) break;
            }
          }
        }
      }

      // Execute hide operations
      for (const ownerId of ownersToHide) {
        try {
          await this.visibilityService.hideAllForUser(ownerId);
        } catch (err: any) {
          this.logger.error(
            `Reconciliation failed hiding content for owner ${ownerId}: ${err.message}`,
          );
        }
      }

      // Execute restore operations
      for (const ownerId of ownersToRestore) {
        try {
          await this.visibilityService.restoreAllForUser(ownerId);
        } catch (err: any) {
          this.logger.error(
            `Reconciliation failed restoring content for owner ${ownerId}: ${err.message}`,
          );
        }
      }

      this.logger.log(
        `Visibility reconciliation complete: hid content for ${ownersToHide.size} owners, restored content for ${ownersToRestore.size} owners`,
      );

      return {
        hiddenOwnersCount: ownersToHide.size,
        restoredOwnersCount: ownersToRestore.size,
      };
    } finally {
      try {
        await this.redis.del(RECONCILIATION_LOCK_KEY);
      } catch (err: any) {
        this.logger.warn(`Failed releasing reconciliation lock: ${err.message}`);
      }
    }
  }
}
