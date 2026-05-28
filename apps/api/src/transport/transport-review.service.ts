import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TransportReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createReview(bookingId: string, userId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('التقييم يجب أن يكون بين 1 و 5');
    }

    const booking = await this.prisma.transportBooking.findUnique({
      where: { id: bookingId },
      include: {
        request: true,
        quote: { include: { carrier: { include: { user: true } } } },
      },
    });

    if (!booking) throw new NotFoundException('الحجز غير موجود');
    if (booking.request.userId !== userId) {
      throw new ForbiddenException('يمكن لصاحب الطلب فقط تقييم الناقل');
    }
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('لا يمكن التقييم إلا بعد اكتمال الحجز');
    }

    // Check if already reviewed (using bookingId as entityId)
    const existing = await this.prisma.review.findUnique({
      where: {
        reviewerId_entityType_entityId: {
          reviewerId: userId,
          entityType: 'CARRIER_PROFILE',
          entityId: bookingId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('لقد قمت بتقييم هذا الحجز مسبقاً');
    }

    const review = await this.prisma.review.create({
      data: {
        rating,
        comment,
        entityType: 'CARRIER_PROFILE',
        entityId: bookingId, // Use booking ID to uniquely tie it to this trip
        reviewerId: userId,
        revieweeId: booking.quote.carrier.userId, // The carrier's user ID
      },
    });

    // Update carrier profile stats
    const allReviews = await this.prisma.review.findMany({
      where: {
        revieweeId: booking.quote.carrier.userId,
        entityType: 'CARRIER_PROFILE',
      },
      select: { rating: true },
    });

    const totalReviews = allReviews.length;
    const averageRating = totalReviews > 0
      ? allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalReviews
      : 0;

    await this.prisma.carrierProfile.update({
      where: { id: booking.quote.carrierId },
      data: {
        reviewCount: totalReviews,
        averageRating,
      },
    });

    // Notify carrier
    await this.notifications.create({
      type: 'REVIEW_RECEIVED',
      title: 'تقييم جديد',
      body: `لقد حصلت على تقييم ${rating} نجوم من العميل`,
      userId: booking.quote.carrier.userId,
      data: { bookingId, rating },
    });

    return review;
  }

  async getBookingReview(bookingId: string) {
    return this.prisma.review.findFirst({
      where: {
        entityType: 'CARRIER_PROFILE',
        entityId: bookingId,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async getCarrierReviews(carrierId: string, page = 1, limit = 10) {
    const carrier = await this.prisma.carrierProfile.findUnique({
      where: { id: carrierId },
    });

    if (!carrier) throw new NotFoundException('الناقل غير موجود');

    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: {
          revieweeId: carrier.userId,
          entityType: 'CARRIER_PROFILE',
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.review.count({
        where: {
          revieweeId: carrier.userId,
          entityType: 'CARRIER_PROFILE',
        },
      }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
