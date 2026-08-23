import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('search-sync') private readonly searchSyncQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_SECOND)
  async processOutboxEvents() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Find up to 100 pending events
      const events = await this.prisma.outboxEvent.findMany({
        where: { status: 'PENDING' },
        take: 100,
        orderBy: { createdAt: 'asc' },
      });

      if (events.length === 0) {
        this.isProcessing = false;
        return;
      }

      // Extract ids to lock
      const eventIds = events.map((e) => e.id);

      // Lock these rows in the database to prevent concurrent workers from fetching them
      // Requires PostgreSQL
      const lockedEvents: any[] = await this.prisma.$queryRaw`
        SELECT id, "entityType", "entityId", action
        FROM "outbox_events"
        WHERE id = ANY(${eventIds}::text[]) AND status = 'PENDING'
        FOR UPDATE SKIP LOCKED
      `;

      if (lockedEvents.length === 0) {
        this.isProcessing = false;
        return;
      }

      const lockedEventIds = lockedEvents.map((e) => e.id);

      // Enqueue jobs
      const jobs = lockedEvents.map((e) => ({
        name: 'sync-entity',
        data: {
          entityId: e.entityId,
          entityType: e.entityType,
          action: e.action,
          eventId: e.id,
        },
        opts: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
        },
      }));

      await this.searchSyncQueue.addBulk(jobs);

      // Mark as completed
      await this.prisma.outboxEvent.updateMany({
        where: { id: { in: lockedEventIds } },
        data: { status: 'COMPLETED' },
      });
    } catch (error) {
      this.logger.error('Error processing outbox events', error);
    } finally {
      this.isProcessing = false;
    }
  }
}
