import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { ApplyJobDto } from './dto/apply-job.dto';
import { Prisma, ApplicationStatus } from '@prisma/client';
import { generateSlug } from '../common/utils/entity.utils';
import { incrementViewCount } from '../common/utils/view-count.helper';
import { isPrismaUniqueError } from '../common/utils/prisma-error.util';
import { SearchService } from '../search/search.service';
import { INDEXES } from '../search/search.service';

/** Valid application status transitions */
const VALID_TRANSITIONS: Record<string, ApplicationStatus[]> = {
  PENDING: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'],
};

const LIST_CACHE_TTL = 300;    // 5 minutes
const DETAIL_CACHE_TTL = 600;  // 10 minutes

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private notifications: NotificationsService,
    private searchService: SearchService,
  ) {}

  private cacheKey(suffix: string) { return `jobs:${suffix}`; }

  private buildMeiliDoc(job: any) {
    return {
      id: job.id,
      title: job.title,
      description: job.description,
      jobType: job.jobType,
      employmentType: job.employmentType,
      salary: job.salary ? Number(job.salary) : null,
      governorate: job.governorate,
      city: job.city,
      status: job.status,
      viewCount: job.viewCount,
      experienceYears: job.experienceYears,
      createdAt: job.createdAt,
    };
  }

  /* ───── CREATE ───── */
  async create(userId: string, dto: CreateJobDto) {
    const slug = generateSlug(dto.title);

    const job = await this.prisma.driverJob.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        jobType: dto.jobType,
        employmentType: dto.employmentType,
        salary: dto.salary,
        salaryPeriod: dto.salaryPeriod,
        licenseTypes: dto.licenseTypes ?? [],
        experienceYears: dto.experienceYears,
        minAge: dto.minAge,
        maxAge: dto.maxAge,
        languages: dto.languages ?? [],
        nationality: dto.nationality,
        vehicleTypes: dto.vehicleTypes ?? [],
        hasOwnVehicle: dto.hasOwnVehicle ?? false,
        governorate: dto.governorate,
        city: dto.city,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        whatsapp: dto.whatsapp,
        userId,
      },
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, phone: true, isVerified: true } } },
    });

    // Sync to Meilisearch + invalidate cache
    this.searchService.indexDocument(INDEXES.JOBS, this.buildMeiliDoc(job))
      .catch((err) => this.logger.warn(`Failed to index job ${job.id}: ${(err as Error).message}`));
    await this.redis.delPattern(this.cacheKey('list:*'));

    // Smart notifications: notify matching drivers for HIRING jobs
    if (dto.jobType === 'HIRING') {
      this.notifyMatchingDrivers(job)
        .catch((err) => this.logger.warn(`Failed to notify matching drivers for job ${job.id}: ${(err as Error).message}`));
    }

    return job;
  }

  /* ───── SMART MATCHING ───── */
  private async notifyMatchingDrivers(job: any) {
    const licenseTypes = job.licenseTypes ?? [];
    if (licenseTypes.length === 0) return;

    const matchingDrivers = await this.prisma.driverProfile.findMany({
      where: {
        governorate: job.governorate,
        licenseTypes: { hasSome: licenseTypes },
        isAvailable: true,
        userId: { not: job.userId },
      },
      select: { userId: true },
      take: 50,
    });

    if (matchingDrivers.length === 0) return;

    const notifPromises = matchingDrivers.map((d) =>
      this.notifications.create({
        userId: d.userId,
        type: 'JOB_RECOMMENDATION' as any,
        title: 'وظيفة قد تناسبك',
        body: `وظيفة جديدة "${job.title}" في ${job.governorate}`,
        data: { jobId: job.id },
      }).catch((err) => this.logger.warn(`Failed to send job recommendation for job ${job.id}: ${(err as Error).message}`)),
    );

    await Promise.allSettled(notifPromises);
  }

  /* ───── FIND ALL (cached) ───── */
  async findAll(query: QueryJobsDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '12', 10)));
    const skip = (page - 1) * limit;

    // Cache check
    const cacheKey = this.cacheKey(`list:${JSON.stringify(query)}`);
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const where: Prisma.DriverJobWhereInput = {};

    // default: only active
    where.status = (query.status as any) || 'ACTIVE';

    if (query.jobType) where.jobType = query.jobType;
    if (query.employmentType) where.employmentType = query.employmentType;
    if (query.governorate) where.governorate = query.governorate;
    if (query.userId) where.userId = query.userId;

    if (query.licenseType) {
      where.licenseTypes = { has: query.licenseType as any };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const allowedSort = ['createdAt', 'salary', 'experienceYears', 'viewCount'];
    const orderBy: any = allowedSort.includes(sortBy)
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.driverJob.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
          _count: { select: { applications: true } },
        },
      }),
      this.prisma.driverJob.count({ where }),
    ]);

    const result = {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };

    await this.redis.set(cacheKey, result, LIST_CACHE_TTL);
    return result;
  }

  /* ───── FIND ONE (cached + rate-limited viewCount) ───── */
  async findOne(id: string, ip?: string) {
    const cKey = this.cacheKey(`detail:${id}`);
    const cached = await this.redis.get<any>(cKey);

    const job = cached ?? await this.prisma.driverJob.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, phone: true, governorate: true, isVerified: true, createdAt: true } },
        _count: { select: { applications: true } },
      },
    });

    if (!job) throw new NotFoundException('الوظيفة غير موجودة');

    if (!cached) await this.redis.set(cKey, job, DETAIL_CACHE_TTL);

    // Rate-limited view count
    const shouldCount = await incrementViewCount(this.redis, 'JOB', id, ip);
    if (shouldCount) {
      await this.prisma.driverJob.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return job;
  }

  /* ───── UPDATE (safe field mapping) ───── */
  async update(id: string, userId: string, dto: UpdateJobDto) {
    const job = await this.prisma.driverJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('الوظيفة غير موجودة');
    if (job.userId !== userId) throw new ForbiddenException('غير مصرح لك بتعديل هذه الوظيفة');

    const DECIMAL_FIELDS = new Set(['salary']);
    const data: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(dto)) {
      if (val === undefined) continue;
      if (key === 'status') {
        if (val !== 'ACTIVE' && val !== 'CLOSED') {
          throw new BadRequestException('يمكن فقط تغيير الحالة إلى ACTIVE أو CLOSED');
        }
        data[key] = val;
        continue;
      }
      data[key] = DECIMAL_FIELDS.has(key) ? new Prisma.Decimal(val as number) : val;
    }

    const updated = await this.prisma.driverJob.update({
      where: { id },
      data,
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } } },
    });

    // Sync to Meilisearch + invalidate caches
    this.searchService.indexDocument(INDEXES.JOBS, this.buildMeiliDoc(updated))
      .catch((err) => this.logger.warn(`Failed to index updated job ${updated.id}: ${(err as Error).message}`));
    await this.redis.del(this.cacheKey(`detail:${id}`));
    await this.redis.delPattern(this.cacheKey('list:*'));

    return updated;
  }

  /* ───── DELETE ───── */
  async remove(id: string, userId: string) {
    const job = await this.prisma.driverJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('الوظيفة غير موجودة');
    if (job.userId !== userId) throw new ForbiddenException('غير مصرح لك بحذف هذه الوظيفة');

    await this.prisma.driverJob.delete({ where: { id } });

    // Clean up orphaned conversations & favorites
    await this.prisma.cleanupPolymorphicOrphans('JOB', id);

    // Remove from Meilisearch + invalidate caches
    this.searchService.removeDocument(INDEXES.JOBS, id)
      .catch((err) => this.logger.warn(`Failed to remove job ${id} from search: ${(err as Error).message}`));
    await this.redis.del(this.cacheKey(`detail:${id}`));
    await this.redis.delPattern(this.cacheKey('list:*'));

    return { message: 'تم حذف الوظيفة بنجاح' };
  }

  /* ───── MY JOBS (paginated) ───── */
  async myJobs(userId: string, page = 1, limit = 20) {
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.driverJob.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          _count: { select: { applications: true } },
        },
      }),
      this.prisma.driverJob.count({ where: { userId } }),
    ]);

    return { items, meta: { total, page, limit: take, totalPages: Math.ceil(total / take) } };
  }

  /* ───── APPLY TO JOB ───── */
  async apply(jobId: string, applicantId: string, dto: ApplyJobDto) {
    const job = await this.prisma.driverJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('الوظيفة غير موجودة');
    if (job.status !== 'ACTIVE') throw new ForbiddenException('هذه الوظيفة مغلقة');
    if (job.userId === applicantId) throw new ForbiddenException('لا يمكنك التقديم على وظيفتك الخاصة');

    let application;
    try {
      application = await this.prisma.jobApplication.create({
        data: {
          jobId,
          applicantId,
          message: dto.message,
          resumeUrl: dto.resumeUrl,
        },
        include: {
          applicant: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
        },
      });
    } catch (err) {
      if (isPrismaUniqueError(err)) {
        throw new ConflictException('لقد قدمت على هذه الوظيفة مسبقاً');
      }
      throw err;
    }

    // notify job owner
    await this.notifications.create({
      userId: job.userId,
      type: 'JOB_APPLICATION',
      title: 'طلب توظيف جديد',
      body: `قام ${application.applicant.displayName || application.applicant.username} بالتقديم على "${job.title}"`,
      data: { jobId, applicationId: application.id },
    });

    return application;
  }

  /* ───── GET APPLICATIONS FOR MY JOB ───── */
  async getApplications(jobId: string, userId: string) {
    const job = await this.prisma.driverJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('الوظيفة غير موجودة');
    if (job.userId !== userId) throw new ForbiddenException('غير مصرح لك بعرض الطلبات');

    return this.prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: {
        applicant: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, phone: true, governorate: true, isVerified: true },
        },
      },
    });
  }

  /* ───── UPDATE APPLICATION STATUS ───── */
  async updateApplicationStatus(applicationId: string, userId: string, status: ApplicationStatus) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: { select: { userId: true, title: true } },
        applicant: { select: { id: true } },
      },
    });

    if (!application) throw new NotFoundException('الطلب غير موجود');
    if (application.job.userId !== userId) throw new ForbiddenException('غير مصرح لك');

    // State machine: validate transition
    const allowed = VALID_TRANSITIONS[application.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `لا يمكن تغيير حالة الطلب من ${application.status} إلى ${status}`,
      );
    }

    const updated = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status },
      include: {
        applicant: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
      },
    });

    // notify applicant
    const notifType = status === 'ACCEPTED' ? 'JOB_APPLICATION_ACCEPTED' : 'JOB_APPLICATION_REJECTED';
    const notifTitle = status === 'ACCEPTED' ? 'تم قبول طلبك' : 'تم رفض طلبك';
    const notifBody = status === 'ACCEPTED'
      ? `تم قبول طلبك على "${application.job.title}"`
      : `للأسف تم رفض طلبك على "${application.job.title}"`;

    await this.notifications.create({
      userId: application.applicant.id,
      type: notifType as any,
      title: notifTitle,
      body: notifBody,
      data: { jobId: application.jobId, applicationId },
    });

    return updated;
  }

  /* ───── WITHDRAW APPLICATION (by applicant) ───── */
  async withdrawApplication(applicationId: string, userId: string) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: { select: { userId: true, title: true } },
      },
    });

    if (!application) throw new NotFoundException('الطلب غير موجود');
    if (application.applicantId !== userId) throw new ForbiddenException('غير مصرح لك بسحب هذا الطلب');

    if (application.status !== 'PENDING') {
      throw new BadRequestException(
        `لا يمكن سحب الطلب — الحالة الحالية: ${application.status}`,
      );
    }

    const updated = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: 'WITHDRAWN' },
    });

    // Notify job owner
    await this.notifications.create({
      userId: application.job.userId,
      type: 'JOB_APPLICATION' as any,
      title: 'تم سحب طلب توظيف',
      body: `قام المتقدم بسحب طلبه على "${application.job.title}"`,
      data: { jobId: application.jobId, applicationId },
    });

    return updated;
  }
}
