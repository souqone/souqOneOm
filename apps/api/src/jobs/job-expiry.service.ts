import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SearchService, INDEXES } from '../search/search.service';
import { NotificationsService } from '../notifications/notifications.service';

const JOB_EXPIRY_DAYS = 30;

@Injectable()
export class JobExpiryService {
  private readonly logger = new Logger(JobExpiryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly searchService: SearchService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async expireOldJobs() {
    // C-3: distributed lock — with multiple API replicas all firing at 04:00 this prevents
    // duplicate notifications. Lock TTL is 5 minutes (well above any realistic run time).
    const lockKey = 'cron:jobs:expiry';
    const acquired = await this.redis.setNX(lockKey, '1', 300);
    if (!acquired) {
      this.logger.log('expireOldJobs: lock held by another instance — skipping');
      return;
    }

    try {
      await this.runExpiry();
    } finally {
      await this.redis.del(lockKey);
    }
  }

  private async runExpiry() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - JOB_EXPIRY_DAYS);

    // Fetch before expiring so we have IDs, titles, and owner info for cleanup and notifications
    const toExpire = await this.prisma.driverJob.findMany({
      where: { status: 'ACTIVE', createdAt: { lt: cutoff } },
      select: { id: true, slug: true, userId: true, title: true },
    });

    if (toExpire.length === 0) return;

    // Expire in batch
    const { count } = await this.prisma.driverJob.updateMany({
      where: { id: { in: toExpire.map((j) => j.id) } },
      data: { status: 'EXPIRED' },
    });

    // CACHE-2: flush list caches so expired jobs stop appearing in browse
    await this.redis.delPattern('jobs:list:*');

    // CACHE-1: flush per-job detail caches (both UUID and slug keys)
    await Promise.all(
      toExpire.flatMap((j) => [
        this.redis.del(`jobs:detail:${j.id}`),
        j.slug ? this.redis.del(`jobs:detail:${j.slug}`) : Promise.resolve(),
      ]),
    );

    // M-1: auto-reject PENDING applications so applicants don't wait in limbo
    await this.prisma.jobApplication.updateMany({
      where: { jobId: { in: toExpire.map((j) => j.id) }, status: 'PENDING' },
      data: { status: 'REJECTED' },
    });

    // SEARCH-1: remove expired jobs from Meilisearch
    for (const job of toExpire) {
      this.searchService.removeDocument(INDEXES.JOBS, job.id)
        .catch(err => this.logger.warn(`Search removal failed for expired job ${job.id}`, err?.message));
    }

    // NOTIF-1: notify each job owner so they know to re-post if needed
    const ownerResults = await Promise.allSettled(
      toExpire.map((job) =>
        this.notifications.create({
          userId: job.userId,
          type: 'SYSTEM' as any,
          title: 'انتهت صلاحية وظيفتك',
          body: `انتهت صلاحية وظيفة "${job.title}" بعد مرور ${JOB_EXPIRY_DAYS} يوماً. يمكنك إعادة نشرها في أي وقت.`,
          data: { jobId: job.id },
        }),
      ),
    );
    ownerResults.forEach((r, i) => {
      if (r.status === 'rejected')
        this.logger.warn(`Expiry notification failed for job owner, job ${toExpire[i].id}`, r.reason);
    });

    this.logger.log(`Expired ${count} jobs older than ${JOB_EXPIRY_DAYS} days`);
  }
}
