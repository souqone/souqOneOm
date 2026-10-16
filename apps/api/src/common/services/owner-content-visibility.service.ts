import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  OWNER_VISIBILITY_REGISTRY,
  OwnerVisibilityConfig,
} from '../constants/owner-visibility.registry';

export const VISIBILITY_BATCH_CHUNK_SIZE = 500;

export interface VerticalMutationError {
  vertical: string;
  error: Error;
}

export class VisibilityCrossVerticalError extends Error {
  constructor(
    message: string,
    public readonly errors: VerticalMutationError[],
  ) {
    super(
      `${message}: ${errors.map((e) => `[${e.vertical}]: ${e.error.message}`).join(', ')}`,
    );
    this.name = 'VisibilityCrossVerticalError';
  }
}

export interface VisibilityMutationResult {
  userId: string;
  affectedCounts: Record<string, number>;
  totalAffected: number;
}

@Injectable()
export class OwnerContentVisibilityService {
  private readonly logger = new Logger(OwnerContentVisibilityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Hides all content owned by the specified user across all 11 registered verticals.
   *
   * Idempotent: operates exclusively on rows where `hiddenByOwnerStatus === false`.
   * Batched in chunks of 500 within individual transactions.
   * Generates OutboxEvent with action `DELETE` for Meilisearch-indexed entities.
   * Invalidates Redis cache keys upon transaction commit.
   * Cross-vertical isolation: failures in one vertical do not abort others; errors are aggregated and rethrown.
   */
  async hideAllForUser(userId: string): Promise<VisibilityMutationResult> {
    return this.mutateOwnerVisibility(userId, {
      fromStatus: false,
      toStatus: true,
      outboxAction: 'DELETE',
      operationName: 'hideAllForUser',
    });
  }

  /**
   * Restores all content owned by the specified user across all 11 registered verticals.
   *
   * Idempotent: operates exclusively on rows where `hiddenByOwnerStatus === true`.
   * Batched in chunks of 500 within individual transactions.
   * Generates OutboxEvent with action `UPSERT` for Meilisearch-indexed entities (worker determines indexing by item status).
   * Invalidates Redis cache keys upon transaction commit.
   * Cross-vertical isolation: failures in one vertical do not abort others; errors are aggregated and rethrown.
   */
  async restoreAllForUser(userId: string): Promise<VisibilityMutationResult> {
    return this.mutateOwnerVisibility(userId, {
      fromStatus: true,
      toStatus: false,
      outboxAction: 'UPSERT',
      operationName: 'restoreAllForUser',
    });
  }

  private async mutateOwnerVisibility(
    userId: string,
    options: {
      fromStatus: boolean;
      toStatus: boolean;
      outboxAction: 'DELETE' | 'UPSERT';
      operationName: string;
    },
  ): Promise<VisibilityMutationResult> {
    const affectedCounts: Record<string, number> = {};
    const errors: VerticalMutationError[] = [];

    for (const config of OWNER_VISIBILITY_REGISTRY) {
      try {
        const count = await this.mutateVertical(userId, config, options);
        affectedCounts[config.entityType] = count;
      } catch (err: any) {
        this.logger.error(
          `Failed to mutate visibility for user ${userId} in vertical ${config.entityType}: ${err.message}`,
          err.stack,
        );
        errors.push({
          vertical: config.entityType,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    }

    if (errors.length > 0) {
      throw new VisibilityCrossVerticalError(
        `Failed executing ${options.operationName} for user ${userId}`,
        errors,
      );
    }

    const totalAffected = Object.values(affectedCounts).reduce(
      (sum, count) => sum + count,
      0,
    );

    return {
      userId,
      affectedCounts,
      totalAffected,
    };
  }

  private async mutateVertical(
    userId: string,
    config: OwnerVisibilityConfig,
    options: {
      fromStatus: boolean;
      toStatus: boolean;
      outboxAction: 'DELETE' | 'UPSERT';
    },
  ): Promise<number> {
    const delegate = (this.prisma as any)[config.prismaDelegate];
    if (!delegate || typeof delegate.findMany !== 'function') {
      throw new Error(`Prisma delegate "${config.prismaDelegate}" not found on PrismaService`);
    }

    let verticalCount = 0;

    // Process in batches of 500 to protect memory and transaction limits
    while (true) {
      const batch = await delegate.findMany({
        where: {
          [config.ownerField]: userId,
          hiddenByOwnerStatus: options.fromStatus,
        },
        select: { id: true },
        take: VISIBILITY_BATCH_CHUNK_SIZE,
      });

      if (!batch || batch.length === 0) {
        break;
      }

      const ids: string[] = batch.map((item: any) => item.id);

      await this.prisma.$transaction(async (tx: any) => {
        const txDelegate = tx[config.prismaDelegate];
        await txDelegate.updateMany({
          where: { id: { in: ids } },
          data: { hiddenByOwnerStatus: options.toStatus },
        });

        if (config.indexedInMeili) {
          await tx.outboxEvent.createMany({
            data: ids.map((id) => ({
              entityType: config.entityType,
              entityId: id,
              action: options.outboxAction,
            })),
          });
        }
      });

      verticalCount += ids.length;

      // Invalidate Redis caches after transaction commit
      if (config.cachePatterns && config.cachePatterns.length > 0) {
        for (const pattern of config.cachePatterns) {
          try {
            await this.redis.delPattern(pattern);
          } catch (cacheErr: any) {
            this.logger.warn(
              `Failed clearing cache pattern "${pattern}" for vertical ${config.entityType}: ${cacheErr.message}`,
            );
          }
        }
      }

      if (batch.length < VISIBILITY_BATCH_CHUNK_SIZE) {
        break;
      }
    }

    return verticalCount;
  }
}
