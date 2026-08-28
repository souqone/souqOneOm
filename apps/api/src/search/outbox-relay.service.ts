import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

interface LockedOutboxEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  attempts: number;
}

const MAX_ATTEMPTS = 5;

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

    // Captured from inside the transaction so the catch block can still see
    // which events were locked even if the transaction itself rolled back.
    let lockedEvents: LockedOutboxEvent[] = [];

    try {
      await this.prisma.$transaction(
        async (tx) => {
          // Find up to 100 pending, due events
          const events = await tx.outboxEvent.findMany({
            where: { status: 'PENDING', availableAt: { lte: new Date() } },
            take: 100,
            orderBy: { createdAt: 'asc' },
          });

          if (events.length === 0) {
            return;
          }

          // Extract ids to lock
          const eventIds = events.map((e) => e.id);

          // Lock these rows for the duration of this transaction to prevent
          // concurrent workers from fetching them. Requires PostgreSQL.
          lockedEvents = await tx.$queryRaw<LockedOutboxEvent[]>`
            SELECT id, "entityType", "entityId", action, attempts
            FROM "outbox_events"
            WHERE id = ANY(${eventIds}::text[]) AND status = 'PENDING' AND "availableAt" <= NOW()
            FOR UPDATE SKIP LOCKED
          `;

          if (lockedEvents.length === 0) {
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
          await tx.outboxEvent.updateMany({
            where: { id: { in: lockedEventIds } },
            data: { status: 'COMPLETED', processedAt: new Date() },
          });
        },
        { timeout: 10_000 },
      );
    } catch (error) {
      this.logger.error('Error processing outbox events', error);

      // The transaction rolled back, so none of lockedEvents were marked
      // COMPLETED. Update their attempts/status/backoff individually via
      // the plain client (tx is dead at this point).
      for (const event of lockedEvents) {
        const attempts = event.attempts + 1;

        if (attempts >= MAX_ATTEMPTS) {
          this.logger.error(`OutboxEvent ${event.id} permanently failed after ${attempts} attempts`);
          await this.prisma.outboxEvent
            .update({
              where: { id: event.id },
              data: { status: 'FAILED', attempts },
            })
            .catch((updateErr) =>
              this.logger.error(`Failed to mark OutboxEvent ${event.id} as FAILED`, updateErr),
            );
        } else {
          await this.prisma.outboxEvent
            .update({
              where: { id: event.id },
              data: {
                status: 'PENDING',
                attempts,
                availableAt: new Date(Date.now() + Math.min(attempts * 60_000, 600_000)),
              },
            })
            .catch((updateErr) =>
              this.logger.error(`Failed to update retry state for OutboxEvent ${event.id}`, updateErr),
            );
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}
