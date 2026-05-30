import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SearchService, INDEXES } from '../search/search.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly searchService: SearchService,
    private readonly notifications: NotificationsService,
  ) {}

  /* ───── LIST JOBS ───── */
  async listJobs(query: { page?: string; limit?: string; status?: string; governorate?: string; search?: string }) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.DriverJobWhereInput = {};
    if (query.status) where.status = query.status as any;
    if (query.governorate) where.governorate = query.governorate;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.driverJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, displayName: true, email: true } },
          _count: { select: { applications: true } },
        },
      }),
      this.prisma.driverJob.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /* ───── UPDATE JOB (suspend/activate) ───── */
  async updateJob(jobId: string, data: { status?: string; title?: string }) {
    const job = await this.prisma.driverJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('الوظيفة غير موجودة');

    // ADMIN-2: explicit whitelist — no `as any` that would allow arbitrary field writes
    const safeData: { status?: any; title?: string } = {};
    if (data.status !== undefined) safeData.status = data.status;
    if (data.title !== undefined) safeData.title = data.title;

    const updated = await this.prisma.driverJob.update({
      where: { id: jobId },
      data: safeData,
    });

    // NOTIF-3: notify job owner of admin status change
    if (data.status !== undefined && data.status !== job.status) {
      const statusLabel = data.status === 'ACTIVE' ? 'تم تفعيل وظيفتك' : 'تم تعطيل وظيفتك';
      await this.notifications.create({
        userId: job.userId,
        type: 'SYSTEM' as any,
        title: statusLabel,
        body: `قام فريق الإدارة بتغيير حالة وظيفة "${job.title}"`,
        data: { jobId },
      }).catch(() => {});
    }

    // Invalidate caches
    await this.redis.del(`jobs:detail:${jobId}`);
    if (job.slug) await this.redis.del(`jobs:detail:${job.slug}`);
    await this.redis.delPattern('jobs:list:*');

    return updated;
  }

  /* ───── DELETE JOB ───── */
  async deleteJob(jobId: string) {
    const job = await this.prisma.driverJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('الوظيفة غير موجودة');

    // C-2 + NOTIF-2 + NOTIF-3: notify ACCEPTED and PENDING applicants, and the job owner
    const affectedApps = await this.prisma.jobApplication.findMany({
      where: { jobId, status: { in: ['PENDING', 'ACCEPTED'] } },
      select: { applicantId: true, status: true },
    });

    const notifResults = await Promise.allSettled([
      // Notify owner
      this.notifications.create({
        userId: job.userId,
        type: 'SYSTEM' as any,
        title: 'تم حذف وظيفتك',
        body: `قام فريق الإدارة بحذف وظيفة "${job.title}"`,
        data: { jobId },
      }),
      // Notify all affected applicants
      ...affectedApps.map((app) =>
        this.notifications.create({
          userId: app.applicantId,
          type: 'SYSTEM' as any,
          title: app.status === 'ACCEPTED' ? 'تم حذف الوظيفة التي قُبلت فيها' : 'تم حذف الوظيفة',
          body: `الوظيفة "${job.title}" التي تقدمت عليها لم تعد متاحة`,
          data: { jobId },
        }),
      ),
    ]);
    notifResults.forEach((r, i) => {
      if (r.status === 'rejected') {
        const who = i === 0 ? 'owner' : `applicant ${affectedApps[i - 1]?.applicantId}`;
        console.warn(`Admin delete notification failed for ${who} of job ${jobId}`, r.reason);
      }
    });

    await this.prisma.driverJob.delete({ where: { id: jobId } });

    // ADMIN-1: full cleanup — orphans, search index, caches
    await this.prisma.cleanupPolymorphicOrphans('JOB', jobId);

    this.searchService.removeDocument(INDEXES.JOBS, jobId).catch(() => {});

    await this.redis.del(`jobs:detail:${jobId}`);
    if (job.slug) await this.redis.del(`jobs:detail:${job.slug}`);
    await this.redis.delPattern('jobs:list:*');

    return { message: 'تم حذف الوظيفة' };
  }

  /* ───── STATS ───── */
  async getStats() {
    const [
      totalJobs,
      activeJobs,
      closedJobs,
      expiredJobs,
      totalApplications,
      acceptedApplications,
      totalDrivers,
      verifiedDrivers,
      totalEmployers,
      pendingVerifications,
    ] = await Promise.all([
      this.prisma.driverJob.count(),
      this.prisma.driverJob.count({ where: { status: 'ACTIVE' } }),
      this.prisma.driverJob.count({ where: { status: 'CLOSED' } }),
      this.prisma.driverJob.count({ where: { status: 'EXPIRED' } }),
      this.prisma.jobApplication.count(),
      this.prisma.jobApplication.count({ where: { status: 'ACCEPTED' } }),
      this.prisma.driverProfile.count(),
      this.prisma.driverProfile.count({ where: { isVerified: true } }),
      this.prisma.employerProfile.count(),
      this.prisma.driverVerification.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      jobs: { total: totalJobs, active: activeJobs, closed: closedJobs, expired: expiredJobs },
      applications: { total: totalApplications, accepted: acceptedApplications },
      drivers: { total: totalDrivers, verified: verifiedDrivers },
      employers: { total: totalEmployers },
      verifications: { pending: pendingVerifications },
    };
  }

  /* ───── LIST DRIVERS ───── */
  async listDrivers(query: { page?: string; limit?: string; isVerified?: string }) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.DriverProfileWhereInput = {};
    if (query.isVerified !== undefined) where.isVerified = query.isVerified === 'true';

    const [items, total] = await Promise.all([
      this.prisma.driverProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, displayName: true, email: true, avatarUrl: true, isVerified: true } },
        },
      }),
      this.prisma.driverProfile.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /* ───── LIST EMPLOYERS ───── */
  async listEmployers(query: { page?: string; limit?: string }) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.employerProfile.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, displayName: true, email: true, avatarUrl: true, isVerified: true } },
        },
      }),
      this.prisma.employerProfile.count(),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
