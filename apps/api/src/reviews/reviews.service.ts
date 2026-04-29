import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, ReviewEntityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateReviewDto, reviewerId: string) {
    if (dto.revieweeId === reviewerId) {
      throw new BadRequestException('لا يمكنك تقييم نفسك');
    }

    // Job-related review validation: require ACCEPTED application
    if (dto.entityType === 'DRIVER_PROFILE' || dto.entityType === 'EMPLOYER_PROFILE') {
      await this.validateJobReview(dto, reviewerId);
    }

    const existing = await this.prisma.review.findUnique({
      where: {
        reviewerId_entityType_entityId: {
          reviewerId,
          entityType: dto.entityType as ReviewEntityType,
          entityId: dto.entityId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('لقد قمت بتقييم هذا العنصر مسبقاً');
    }

    const review = await this.prisma.review.create({
      data: {
        rating: dto.rating,
        comment: dto.comment,
        entityType: dto.entityType as ReviewEntityType,
        entityId: dto.entityId,
        reviewerId,
        revieweeId: dto.revieweeId,
      },
      include: {
        reviewer: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
      },
    });

    // Recalculate average rating
    await this.recalculateUserRating(dto.revieweeId);

    // Also recalculate profile-level ratings for job reviews
    if (dto.entityType === 'DRIVER_PROFILE') {
      await this.recalculateDriverProfileRating(dto.entityId);
    } else if (dto.entityType === 'EMPLOYER_PROFILE') {
      await this.recalculateEmployerProfileRating(dto.entityId);
    }

    // Notify the reviewee
    try {
      await this.notifications.create({
        type: 'REVIEW_RECEIVED',
        title: 'تقييم جديد',
        body: `حصلت على تقييم ${dto.rating} نجوم`,
        userId: dto.revieweeId,
        data: { reviewId: review.id, entityType: dto.entityType, entityId: dto.entityId },
      });
    } catch { /* non-critical */ }

    return review;
  }

  async findAll(query: QueryReviewsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {};
    if (query.userId) where.revieweeId = query.userId;
    if (query.entityType) where.entityType = query.entityType as ReviewEntityType;
    if (query.entityId) where.entityId = query.entityId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          reviewer: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
          reply: true,
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { averageRating: true, reviewCount: true },
    });

    if (!user) throw new NotFoundException('المستخدم غير موجود');

    // Distribution (1-5 stars)
    const distribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { revieweeId: userId },
      _count: true,
    });

    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of distribution) {
      dist[d.rating] = d._count;
    }

    return {
      averageRating: user.averageRating ?? 0,
      reviewCount: user.reviewCount,
      distribution: dist,
    };
  }

  async reply(reviewId: string, dto: ReplyReviewDto, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { reply: true },
    });

    if (!review) throw new NotFoundException('التقييم غير موجود');
    if (review.revieweeId !== userId) throw new ForbiddenException('يمكن فقط لصاحب الحساب الرد');
    if (review.reply) throw new BadRequestException('تم الرد على هذا التقييم مسبقاً');

    return this.prisma.reviewReply.create({
      data: {
        body: dto.body,
        reviewId,
      },
    });
  }

  private async validateJobReview(dto: CreateReviewDto, reviewerId: string) {
    // Check there is an ACCEPTED application between the reviewer and the profile owner
    const application = await this.prisma.jobApplication.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          // Employer reviewing a driver: employer owns the job, driver applied
          { job: { userId: reviewerId }, applicantId: dto.revieweeId },
          // Driver reviewing an employer: driver applied, employer owns the job
          { applicantId: reviewerId, job: { userId: dto.revieweeId } },
        ],
      },
    });

    if (!application) {
      throw new BadRequestException('لا يمكنك تقييم إلا بعد قبول طلب التوظيف');
    }
  }

  private async recalculateUserRating(userId: string) {
    const result = await this.prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        averageRating: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : null,
        reviewCount: result._count,
      },
    });
  }

  private async recalculateDriverProfileRating(profileId: string) {
    const result = await this.prisma.review.aggregate({
      where: { entityType: 'DRIVER_PROFILE', entityId: profileId },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.driverProfile.update({
      where: { id: profileId },
      data: {
        averageRating: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : null,
        reviewCount: result._count,
      },
    });
  }

  private async recalculateEmployerProfileRating(profileId: string) {
    const result = await this.prisma.review.aggregate({
      where: { entityType: 'EMPLOYER_PROFILE', entityId: profileId },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.employerProfile.update({
      where: { id: profileId },
      data: {
        averageRating: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : null,
        reviewCount: result._count,
      },
    });
  }
}
