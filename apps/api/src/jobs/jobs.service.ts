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
import { Prisma, ApplicationStatus, NotificationType } from '@prisma/client';
import { generateSlug } from '../common/utils/entity.utils';
import { incrementViewCount } from '../common/utils/view-count.helper';
import { isPrismaUniqueError } from '../common/utils/prisma-error.util';
import { SearchService } from '../search/search.service';
import { INDEXES } from '../search/search.service';

/** Valid application status transitions — WITHDRAWN is applicant-only (via withdrawApplication) */
const VALID_TRANSITIONS: Record<string, ApplicationStatus[]> = {
  PENDING: ['ACCEPTED', 'REJECTED'],
};

/** Valid job status transitions by owner — EXPIRED is terminal and system-only */
const JOB_STATUS_TRANSITIONS: Record<string, string[]> = {
  ACTIVE: ['CLOSED'],
  CLOSED: [],
  EXPIRED: [],
};

const LIST_CACHE_TTL = 300;
const DETAIL_CACHE_TTL = 600;

/** Fields exposed on public job listings — no phone */
const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  governorate: true,
  isVerified: true,
  createdAt: true,
};

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
    // BL-4: cross-field age validation
    if (dto.minAge !== undefined && dto.maxAge !== undefined && dto.minAge >= dto.maxAge) {
      throw new BadRequestException('minAge يجب أن يكون أصغر من maxAge');
    }

    // BL-5: poster must have the matching profile type
    if (dto.jobType === 'HIRING') {
      const ep = await this.prisma.employerProfile.findUnique({ where: { userId } });
      if (!ep) throw new ForbiddenException('يجب إنشاء ملف صاحب عمل قبل نشر وظيفة توظيف');
    } else if (dto.jobType === 'OFFERING') {
      const dp = await this.prisma.driverProfile.findUnique({ where: { userId } });
      if (!dp) throw new ForbiddenException('يجب إنشاء ملف سائق قبل نشر عرض خدمة');
    }

    const baseSlug = generateSlug(dto.title);

    const createData = {
      title: dto.title,
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
    };

    const include = {
      user: { select: PUBLIC_USER_SELECT },
    };

    // BL-2: retry on slug collision (unique constraint)
    let slug = baseSlug;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const job = await this.prisma.driverJob.create({
          data: { ...createData, slug },
          include,
        });

        this.searchService.indexDocument(INDEXES.JOBS, this.buildMeiliDoc(job))
          .catch((err) => this.logger.warn(`Failed to index job ${job.id}: ${(err as Error).message}`));
        await this.redis.delPattern(this.cacheKey('list:*'));

        return job;
      } catch (err) {
        if (isPrismaUniqueError(err) && attempt < 4) {
          slug = `${baseSlug}-${Date.now()}`;
          continue;
        }
        throw err;
      }
    }
  }

  /* ───── FIND ALL (cached) ───── */
  async findAll(query: QueryJobsDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '12', 10)));
    const skip = (page - 1) * limit;

    const cacheKey = this.cacheKey(`list:${JSON.stringify(query)}`);
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const where: Prisma.DriverJobWhereInput = {};
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
          user: { select: PUBLIC_USER_SELECT },
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

    const job = cached ?? await this.prisma.driverJob.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        user: { select: { ...PUBLIC_USER_SELECT, governorate: true } },
        _count: { select: { applications: true } },
      },
    });

    if (!job) throw new NotFoundException('الوظيفة غير موجودة');

    if (!cached) await this.redis.set(cKey, job, DETAIL_CACHE_TTL);

    const shouldCount = await incrementViewCount(this.redis, 'JOB', id, ip);
    if (shouldCount) {
      await this.prisma.driverJob.update({
        where: { id: job.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return job;
  }

  /* ───── UPDATE ───── */
  async update(id: string, userId: string, dto: UpdateJobDto) {
    const job = await this.prisma.driverJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('الوظيفة غير موجودة');
    if (job.userId !== userId) throw new ForbiddenException('غير مصرح لك بتعديل هذه الوظيفة');

    // AUTH-2: enforce state machine — EXPIRED is terminal, CLOSED cannot re-open
    if (dto.status !== undefined) {
      const allowed = JOB_STATUS_TRANSITIONS[job.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `لا يمكن تغيير الحالة من ${job.status} إلى ${dto.status}`,
        );
      }
    }

    // BL-4: cross-field age validation (consider existing values)
    const effectiveMin = dto.minAge ?? (job.minAge ?? undefined);
    const effectiveMax = dto.maxAge ?? (job.maxAge ?? undefined);
    if (effectiveMin !== undefined && effectiveMax !== undefined && effectiveMin >= effectiveMax) {
      throw new BadRequestException('minAge يجب أن يكون أصغر من maxAge');
    }

    const DECIMAL_FIELDS = new Set(['salary']);
    const data: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(dto)) {
      if (val === undefined) continue;
      if (key === 'status') {
        data[key] = val;
        continue;
      }
      data[key] = DECIMAL_FIELDS.has(key) ? new Prisma.Decimal(val as number) : val;
    }

    const updated = await this.prisma.driverJob.update({
      where: { id },
      data,
      include: { user: { select: PUBLIC_USER_SELECT } },
    });

    // M-1 + NOTIF-2: on close, reject all PENDING applications and notify applicants
    if (dto.status === 'CLOSED') {
      const pendingApps = await this.prisma.jobApplication.findMany({
        where: { jobId: id, status: 'PENDING' },
        select: { applicantId: true },
      });

      if (pendingApps.length > 0) {
        // Auto-reject pending applications so they don't stay in limbo forever
        await this.prisma.jobApplication.updateMany({
          where: { jobId: id, status: 'PENDING' },
          data: { status: 'REJECTED' },
        });

        const results = await Promise.allSettled(
          pendingApps.map((app) =>
            this.notifications.create({
              userId: app.applicantId,
              type: 'SYSTEM' as any,
              title: 'تم إغلاق الوظيفة',
              body: `الوظيفة "${job.title}" التي تقدمت عليها أُغلقت`,
              data: { jobId: id },
            }),
          ),
        );
        results.forEach((r, i) => {
          if (r.status === 'rejected')
            this.logger.warn(`Close notification failed for applicant ${pendingApps[i].applicantId}`, r.reason);
        });
      }
    }

    this.searchService.indexDocument(INDEXES.JOBS, this.buildMeiliDoc(updated))
      .catch((err) => this.logger.warn(`Failed to index updated job ${updated.id}: ${(err as Error).message}`));

    // CACHE-1: invalidate both UUID and slug-based cache keys
    await this.redis.del(this.cacheKey(`detail:${id}`));
    if (job.slug) await this.redis.del(this.cacheKey(`detail:${job.slug}`));
    await this.redis.delPattern(this.cacheKey('list:*'));

    return updated;
  }

  /* ───── DELETE ───── */
  async remove(id: string, userId: string) {
    const job = await this.prisma.driverJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('الوظيفة غير موجودة');
    if (job.userId !== userId) throw new ForbiddenException('غير مصرح لك بحذف هذه الوظيفة');

    // C-2 + NOTIF-2: notify ALL affected applicants before deletion (FK will cascade)
    // ACCEPTED applicants are the most harmed — they must be notified, not just PENDING ones
    const affectedApps = await this.prisma.jobApplication.findMany({
      where: { jobId: id, status: { in: ['PENDING', 'ACCEPTED'] } },
      select: { applicantId: true, status: true },
    });

    const notifResults = await Promise.allSettled(
      affectedApps.map((app) =>
        this.notifications.create({
          userId: app.applicantId,
          type: 'SYSTEM' as any,
          title: app.status === 'ACCEPTED' ? 'تم حذف الوظيفة التي قُبلت فيها' : 'تم حذف الوظيفة',
          body: `الوظيفة "${job.title}" التي تقدمت عليها لم تعد متاحة`,
          data: { jobId: id },
        }),
      ),
    );
    notifResults.forEach((r, i) => {
      if (r.status === 'rejected')
        this.logger.warn(`Delete notification failed for applicant ${affectedApps[i].applicantId}`, r.reason);
    });

    await this.prisma.driverJob.delete({ where: { id } });
    await this.prisma.cleanupPolymorphicOrphans('JOB', id);

    this.searchService.removeDocument(INDEXES.JOBS, id)
      .catch((err) => this.logger.warn(`Failed to remove job ${id} from search: ${(err as Error).message}`));

    // CACHE-1: invalidate both UUID and slug-based cache keys
    await this.redis.del(this.cacheKey(`detail:${id}`));
    if (job.slug) await this.redis.del(this.cacheKey(`detail:${job.slug}`));
    await this.redis.delPattern(this.cacheKey('list:*'));

    return { message: 'تم حذف الوظيفة بنجاح' };
  }

  /* ───── MY JOBS (paginated + status filter) ───── */
  async myJobs(userId: string, page = 1, limit = 20, status?: string) {
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    // UX-2: support status filter so dashboard tabs don't over-fetch
    const where: Prisma.DriverJobWhereInput = { userId };
    if (status) where.status = status as any;

    const [items, total] = await Promise.all([
      this.prisma.driverJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          _count: { select: { applications: true } },
        },
      }),
      this.prisma.driverJob.count({ where }),
    ]);

    return { items, meta: { total, page, limit: take, totalPages: Math.ceil(total / take) } };
  }

  /* ───── APPLY TO JOB ───── */
  async apply(jobId: string, applicantId: string, dto: ApplyJobDto) {
    const job = await this.prisma.driverJob.findFirst({
      where: { OR: [{ id: jobId }, { slug: jobId }] },
    });
    if (!job) throw new NotFoundException('الوظيفة غير موجودة');
    if (job.status !== 'ACTIVE') throw new ForbiddenException('هذه الوظيفة مغلقة');
    if (job.userId === applicantId) throw new ForbiddenException('لا يمكنك التقديم على وظيفتك الخاصة');

    // AUTH-1: applicant must have the matching profile type for this job
    if (job.jobType === 'HIRING') {
      const dp = await this.prisma.driverProfile.findUnique({ where: { userId: applicantId } });
      if (!dp) throw new ForbiddenException('يجب إنشاء ملف سائق للتقديم على هذه الوظيفة');
    } else if (job.jobType === 'OFFERING') {
      const ep = await this.prisma.employerProfile.findUnique({ where: { userId: applicantId } });
      if (!ep) throw new ForbiddenException('يجب إنشاء ملف صاحب عمل للتقديم على هذا العرض');
    }

    let application: any;
    try {
      application = await this.prisma.jobApplication.create({
        data: {
          jobId: job.id,
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

    // C-4: fire-and-forget — notification failure must never orphan the application record
    this.notifications.create({
      userId: job.userId,
      type: 'JOB_APPLICATION' as any,
      title: 'طلب توظيف جديد',
      body: `قام ${application.applicant.displayName || application.applicant.username} بالتقديم على "${job.title}"`,
      data: { jobId: job.id, applicationId: application.id },
    }).catch(err => this.logger.error(`Failed to notify job owner of new application ${application.id}`, err?.stack));

    return application;
  }

  /* ───── GET APPLICATIONS FOR MY JOB (paginated) ───── */
  async getApplications(jobId: string, userId: string, page = 1, limit = 20) {
    const job = await this.prisma.driverJob.findFirst({
      where: { OR: [{ id: jobId }, { slug: jobId }] },
    });

    // LEAK-1: return 404 for both missing and not-owned jobs — prevents job ID enumeration
    if (!job || job.userId !== userId) throw new NotFoundException('الوظيفة غير موجودة');

    // BL-1: paginate to avoid memory bomb on popular jobs
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where: { jobId: job.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          applicant: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              phone: true,       // intentional: job owner contacts the applicant
              governorate: true,
              isVerified: true,
            },
          },
        },
      }),
      this.prisma.jobApplication.count({ where: { jobId: job.id } }),
    ]);

    return { items, meta: { total, page, limit: take, totalPages: Math.ceil(total / take) } };
  }

  /* ───── UPDATE APPLICATION STATUS (job owner: ACCEPTED or REJECTED only) ───── */
  async updateApplicationStatus(applicationId: string, userId: string, status: ApplicationStatus) {
    // H-5: WITHDRAWN is an applicant-only action via withdrawApplication()
    if (status === ('WITHDRAWN' as any)) {
      throw new ForbiddenException('يمكن للمتقدم فقط سحب طلبه عبر مسار السحب المخصص');
    }

    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        // H-3: also select job status to guard against closed/expired jobs
        job: { select: { userId: true, title: true, status: true, id: true } },
        applicant: { select: { id: true } },
      },
    });

    if (!application) throw new NotFoundException('الطلب غير موجود');
    if (application.job.userId !== userId) throw new ForbiddenException('غير مصرح لك');

    // H-3: cannot accept/reject on a job that is no longer active
    if (application.job.status !== 'ACTIVE') {
      throw new BadRequestException('لا يمكن تعديل الطلبات على وظيفة مغلقة أو منتهية');
    }

    const allowed = VALID_TRANSITIONS[application.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `لا يمكن تغيير حالة الطلب من ${application.status} إلى ${status}`,
      );
    }

    // C-1: atomic CAS — only update if the status we read is still the current status.
    // Prevents last-writer-wins when two tabs race to accept/reject simultaneously.
    const casResult = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.jobApplication.updateMany({
        where: { id: applicationId, status: application.status },
        data: { status },
      });
      if (count === 0) return null; // another write won the race
      return tx.jobApplication.findUnique({
        where: { id: applicationId },
        include: {
          applicant: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
        },
      });
    });

    if (!casResult) {
      throw new ConflictException('حالة الطلب تغيرت بالفعل، يرجى تحديث الصفحة والمحاولة مرة أخرى');
    }

    // NOTIF-4: correct notification types — only ACCEPTED or REJECTED reach here
    const notifType = status === 'ACCEPTED'
      ? NotificationType.JOB_APPLICATION_ACCEPTED
      : NotificationType.JOB_APPLICATION_REJECTED;
    const notifTitle = status === 'ACCEPTED' ? 'تم قبول طلبك' : 'تم رفض طلبك';
    const notifBody = status === 'ACCEPTED'
      ? `تم قبول طلبك على "${application.job.title}"`
      : `للأسف تم رفض طلبك على "${application.job.title}"`;

    this.notifications.create({
      userId: application.applicant.id,
      type: notifType as any,
      title: notifTitle,
      body: notifBody,
      data: { jobId: application.job.id, applicationId },
    }).catch(err => this.logger.warn(`Status-change notification failed for ${applicationId}`, err?.stack));

    return casResult;
  }

  /* ───── MY APPLICATIONS (applicant — own applications list) ───── */
  async myApplications(userId: string) {
    // H-9: cap at 100 most-recent to prevent unbounded memory growth.
    // This covers every realistic dashboard / detail-page use-case.
    return this.prisma.jobApplication.findMany({
      where: { applicantId: userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            salary: true,
            salaryPeriod: true,
            currency: true,
            governorate: true,
            status: true,
            userId: true,
            jobType: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                isVerified: true,
              },
            },
          },
        },
      },
    });
  }

  /* ───── WITHDRAW APPLICATION (applicant only) ───── */
  async withdrawApplication(applicationId: string, userId: string) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: { select: { userId: true, title: true, id: true } },
        // NOTIF-5: include applicant name for meaningful notification
        applicant: { select: { displayName: true, username: true } },
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

    const applicantName = application.applicant.displayName || application.applicant.username;
    await this.notifications.create({
      userId: application.job.userId,
      type: NotificationType.JOB_APPLICATION_WITHDRAWN,
      title: 'تم سحب طلب توظيف',
      body: `قام ${applicantName} بسحب طلبه على "${application.job.title}"`,
      data: { jobId: application.job.id, applicationId },
    });

    return updated;
  }
}
