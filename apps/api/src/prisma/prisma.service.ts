import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient, ReviewEntityType } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = process.env.DATABASE_URL;
    super({
      datasources: url ? { db: { url } } : undefined,
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err: any) {
      this.logger.error(`Prisma connection error: ${err.message}`);
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Clean up orphaned Conversation, Favorite, and Review records that reference
   * a deleted entity via the polymorphic entityType + entityId columns.
   *
   * Call this AFTER successfully deleting any entity that can be referenced
   * by Conversations, Favorites, or Reviews.
   */
  async cleanupPolymorphicOrphans(entityType: string, entityId: string): Promise<void> {
    try {
      const operations: Prisma.PrismaPromise<any>[] = [
        this.favorite.deleteMany({ where: { entityType, entityId } }),
        this.conversation.deleteMany({ where: { entityType, entityId } }),
      ];

      const reviewableTypes: string[] = Object.values(ReviewEntityType);
      const isReviewable = reviewableTypes.includes(entityType);
      if (isReviewable) {
        operations.push(
          this.review.deleteMany({
            where: { entityType: entityType as ReviewEntityType, entityId },
          }),
        );
      }

      const results = await this.$transaction(operations);
      const [favs, convs] = results;
      const revs = isReviewable ? results[2] : { count: 0 };

      if (favs.count > 0 || convs.count > 0 || revs.count > 0) {
        this.logger.log(
          `Cleaned orphans for ${entityType}:${entityId} — ${favs.count} favorites, ${convs.count} conversations, ${revs.count} reviews`,
        );
      }
    } catch (err) {
      this.logger.error(`Failed to clean orphans for ${entityType}:${entityId}`, (err as Error).stack);
    }
  }
}
