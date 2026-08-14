import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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
   * Clean up orphaned Conversation and Favorite records that reference
   * a deleted entity via the polymorphic entityType + entityId columns.
   *
   * Call this AFTER successfully deleting any entity that can be referenced
   * by Conversations or Favorites.
   */
  async cleanupPolymorphicOrphans(entityType: string, entityId: string): Promise<void> {
    try {
      const [favs, convs] = await this.$transaction([
        this.favorite.deleteMany({ where: { entityType, entityId } }),
        this.conversation.deleteMany({ where: { entityType, entityId } }),
      ]);
      if (favs.count > 0 || convs.count > 0) {
        this.logger.log(
          `Cleaned orphans for ${entityType}:${entityId} — ${favs.count} favorites, ${convs.count} conversations`,
        );
      }
    } catch (err) {
      this.logger.error(`Failed to clean orphans for ${entityType}:${entityId}`, (err as Error).stack);
    }
  }
}
