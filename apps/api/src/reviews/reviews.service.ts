import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, ReviewEntityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { isPrismaUniqueError } from '../common/utils/prisma-error.util';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';

export const LISTING_REVIEW_ENTITY_TYPES: ReadonlySet<string> = new Set([
  ENTITY_TYPES.LISTING,
  ENTITY_TYPES.BUS_LISTING,
  ENTITY_TYPES.EQUIPMENT_LISTING,
  ENTITY_TYPES.OPERATOR_LISTING,
  ENTITY_TYPES.SPARE_PART,
  ENTITY_TYPES.CAR_SERVICE,
]);

export const CONTACT_ELIGIBLE_REVIEW_ENTITY_TYPES: ReadonlySet<string> = new Set([
  ...LISTING_REVIEW_ENTITY_TYPES,
  ENTITY_TYPES.USER,
]);

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateReviewDto, reviewerId: string) {
    let effectiveRevieweeId = dto.revieweeId;

    if (CONTACT_ELIGIBLE_REVIEW_ENTITY_TYPES.has(dto.entityType)) {
      effectiveRevieweeId = await this.resolveRevieweeId(dto.entityType, dto.entityId);
    }

    if (!effectiveRevieweeId) {
      throw new BadRequestException('معرف المستخدم المقيم مطلوب');
    }

    if (effectiveRevieweeId === reviewerId) {
      throw new BadRequestException('لا يمكنك تقييم نفسك');
    }

    // Carrier reviews must go through POST /transport/bookings/:id/review
    // to guarantee the booking validation runs and prevent duplicate notifications.
    if (dto.entityType === ENTITY_TYPES.CARRIER_PROFILE) {
      throw new BadRequestException(
        'يجب تقييم الناقل من خلال صفحة الحجز (POST /transport/bookings/:id/review)',
      );
    }

    // Job-related review validation: require ACCEPTED application
    if (dto.entityType === ENTITY_TYPES.DRIVER_PROFILE || dto.entityType === ENTITY_TYPES.EMPLOYER_PROFILE) {
      await this.validateJobReview(dto, reviewerId);
    }

    if (CONTACT_ELIGIBLE_REVIEW_ENTITY_TYPES.has(dto.entityType)) {
      await this.validateContactEligibility(dto.entityType, dto.entityId, effectiveRevieweeId, reviewerId);
    }

    let review;
    try {
      review = await this.prisma.review.create({
        data: {
          rating: dto.rating,
          comment: dto.comment,
          entityType: dto.entityType as ReviewEntityType,
          entityId: dto.entityId,
          reviewerId,
          revieweeId: effectiveRevieweeId,
        },
        include: {
          reviewer: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
        },
      });
    } catch (err) {
      if (isPrismaUniqueError(err)) {
        throw new BadRequestException('لقد قمت بتقييم هذا العنصر مسبقاً');
      }
      throw err;
    }

    // Recalculate average rating
    await this.recalculateUserRating(effectiveRevieweeId);

    // Also recalculate profile-level ratings for job reviews
    if (dto.entityType === ENTITY_TYPES.DRIVER_PROFILE) {
      await this.recalculateDriverProfileRating(dto.entityId);
    } else if (dto.entityType === ENTITY_TYPES.EMPLOYER_PROFILE) {
      await this.recalculateEmployerProfileRating(dto.entityId);
    } else if (dto.entityType === ENTITY_TYPES.CARRIER_PROFILE) {
      await this.recalculateCarrierProfileRating(dto.entityId);
    }

    // Notify the reviewee
    try {
      await this.notifications.create({
        type: 'REVIEW_RECEIVED',
        title: 'تقييم جديد',
        body: `حصلت على تقييم ${dto.rating} نجوم`,
        userId: effectiveRevieweeId,
        data: { reviewId: review.id, entityType: dto.entityType, entityId: dto.entityId },
      });
    } catch (err) {
      this.logger.warn(`Failed to send review notification: ${(err as Error).message}`);
    }

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

  private async resolveRevieweeId(entityType: string, entityId: string): Promise<string> {
    switch (entityType) {
      case ENTITY_TYPES.USER: {
        const user = await this.prisma.user.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
        if (!user) throw new NotFoundException('المستخدم غير موجود');
        return user.id;
      }
      case ENTITY_TYPES.LISTING: {
        const row = await this.prisma.listing.findUnique({
          where: { id: entityId },
          select: { sellerId: true },
        });
        if (!row) throw new NotFoundException('الإعلان غير موجود');
        return row.sellerId;
      }
      case ENTITY_TYPES.BUS_LISTING: {
        const row = await this.prisma.busListing.findUnique({
          where: { id: entityId },
          select: { userId: true, deletedAt: true },
        });
        if (!row || row.deletedAt != null) throw new NotFoundException('إعلان الحافلة غير موجود');
        return row.userId;
      }
      case ENTITY_TYPES.EQUIPMENT_LISTING: {
        const row = await this.prisma.equipmentListing.findUnique({
          where: { id: entityId },
          select: { userId: true, deletedAt: true },
        });
        if (!row || row.deletedAt != null) throw new NotFoundException('الإعلان غير موجود');
        return row.userId;
      }
      case ENTITY_TYPES.OPERATOR_LISTING: {
        const row = await this.prisma.operatorListing.findUnique({
          where: { id: entityId },
          select: { userId: true },
        });
        if (!row) throw new NotFoundException('إعلان المشغل غير موجود');
        return row.userId;
      }
      case ENTITY_TYPES.SPARE_PART: {
        const row = await this.prisma.sparePart.findUnique({
          where: { id: entityId },
          select: { sellerId: true, deletedAt: true },
        });
        if (!row || row.deletedAt != null) throw new NotFoundException('قطعة الغيار غير موجودة');
        return row.sellerId;
      }
      case ENTITY_TYPES.CAR_SERVICE: {
        const row = await this.prisma.carService.findUnique({
          where: { id: entityId },
          select: { userId: true, deletedAt: true },
        });
        if (!row || row.deletedAt != null) throw new NotFoundException('الخدمة غير موجودة');
        return row.userId;
      }
      default:
        throw new BadRequestException('نوع كيان غير معروف');
    }
  }

  private async validateContactEligibility(
    entityType: string,
    entityId: string,
    revieweeId: string,
    reviewerId: string,
  ) {
    const where: Prisma.ConversationWhereInput =
      entityType === ENTITY_TYPES.USER
        ? {
            AND: [
              { participants: { some: { userId: reviewerId } } },
              { participants: { some: { userId: revieweeId } } },
            ],
            messages: { some: { senderId: reviewerId } },
          }
        : {
            entityType,
            entityId,
            participants: { some: { userId: reviewerId } },
            messages: { some: { senderId: reviewerId } },
          };

    const contactRecord = await this.prisma.conversation.findFirst({ where });
    if (!contactRecord) {
      const msg =
        entityType === ENTITY_TYPES.OPERATOR_LISTING
          ? 'يمكنك فقط تقييم المشغل بعد التواصل معه عبر الرسائل أولاً'
          : entityType === ENTITY_TYPES.USER
            ? 'يمكنك فقط تقييم البائع بعد التواصل معه عبر الرسائل أولاً'
            : 'يمكنك فقط تقييم صاحب الإعلان بعد التواصل معه عبر الرسائل أولاً';
      throw new BadRequestException(msg);
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
      where: { entityType: ENTITY_TYPES.DRIVER_PROFILE, entityId: profileId },
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
      where: { entityType: ENTITY_TYPES.EMPLOYER_PROFILE, entityId: profileId },
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

  private async recalculateCarrierProfileRating(profileId: string) {
    const result = await this.prisma.review.aggregate({
      where: { entityType: ENTITY_TYPES.CARRIER_PROFILE, entityId: profileId },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.carrierProfile.update({
      where: { id: profileId },
      data: {
        averageRating: result._avg?.rating ? Math.round(result._avg.rating * 10) / 10 : 0,
        reviewCount: result._count as unknown as number,
      },
    });
  }
}
