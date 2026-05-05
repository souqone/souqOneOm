import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminJobsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.driverJob.update({
      where: { id: jobId },
      data: data as any,
    });
  }

  /* ───── DELETE JOB ───── */
  async deleteJob(jobId: string) {
    const job = await this.prisma.driverJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('الوظيفة غير موجودة');

    return this.prisma.driverJob.delete({ where: { id: jobId } });
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
