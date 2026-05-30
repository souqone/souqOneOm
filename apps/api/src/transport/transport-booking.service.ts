import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  isVerified: true,
};

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

@Injectable()
export class TransportBookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Issue 1 fix: flush every cached view of a request after any booking mutation.
   */
  private async invalidateRequestCache(requestId: string): Promise<void> {
    await Promise.allSettled([
      this.redis.delPattern('transport:list:*'),
      this.redis.del(`transport:request:${requestId}`),
      this.redis.del(`transport:request:${requestId}:auth`),
    ]);
  }

  async markInProgress(bookingId: string, carrierId: string) {
    const booking = await this.prisma.transportBooking.findUnique({
      where: { id: bookingId },
      include: {
        request: true,
        quote: { include: { carrier: true } },
      },
    });
    if (!booking) throw new NotFoundException('الحجز غير موجود');

    // Only the carrier can start
    if (booking.quote.carrier.userId !== carrierId) {
      throw new ForbiddenException('فقط الناقل يمكنه بدء الرحلة');
    }

    if (booking.status !== 'ACCEPTED') {
      throw new BadRequestException('لا يمكن بدء هذا الحجز');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const b = await tx.transportBooking.update({
        where: { id: bookingId },
        data: { status: 'IN_PROGRESS' },
      });
      await tx.transportRequest.update({
        where: { id: booking.requestId },
        data: { status: 'IN_PROGRESS' },
      });
      return b;
    });

    // Issue 1 fix: flush stale caches (request status changed to IN_PROGRESS)
    await this.invalidateRequestCache(booking.requestId);

    // Notify shipper — TRANSPORT_BOOKING_STARTED: booking was confirmed earlier; this is "in motion"
    await this.notifications.create({
      type: 'TRANSPORT_BOOKING_STARTED',
      title: 'بدأ النقل',
      body: 'الناقل بدأ في تنفيذ طلبك وهو في الطريق',
      userId: booking.request.userId,
      data: { bookingId },
    });

    return updated;
  }

  async complete(bookingId: string, shipperId: string, deliveryNote?: string) {
    const booking = await this.prisma.transportBooking.findUnique({
      where: { id: bookingId },
      include: {
        request: true,
        quote: { include: { carrier: true } },
      },
    });
    if (!booking) throw new NotFoundException('الحجز غير موجود');

    // Only shipper can mark as complete
    if (booking.request.userId !== shipperId) {
      throw new ForbiddenException('فقط طالب الخدمة يمكنه إتمام الحجز');
    }

    if (booking.status !== 'IN_PROGRESS') {
      throw new BadRequestException('لا يمكن إتمام هذا الحجز');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const b = await tx.transportBooking.update({
        where: { id: bookingId },
        data: { status: 'COMPLETED', completedAt: new Date(), deliveryNote },
      });
      await tx.transportRequest.update({
        where: { id: booking.requestId },
        data: { status: 'COMPLETED' },
      });
      // Increment carrier completed trips
      await tx.carrierProfile.update({
        where: { id: booking.quote.carrierId },
        data: { completedTrips: { increment: 1 } },
      });
      return b;
    });

    // Issue 1 fix: flush stale caches (request status changed to COMPLETED)
    await this.invalidateRequestCache(booking.requestId);

    // Notify carrier — TRANSPORT_BOOKING_COMPLETED (not TRANSPORT_REQUEST_CLOSED)
    await this.notifications.create({
      type: 'TRANSPORT_BOOKING_COMPLETED',
      title: 'تم إتمام الحجز',
      body: 'تم تأكيد إتمام طلب النقل بنجاح — شكراً على خدمتك',
      userId: booking.quote.carrier.userId,
      data: { bookingId },
    });

    // Send review reminder to shipper — fire-and-forget so it never blocks completion
    this.notifications.create({
      type: 'REVIEW_REMINDER',
      title: 'كيف كانت تجربتك؟',
      body: 'قيّم الناقل وساعد الآخرين في اختياراتهم',
      userId: shipperId,
      data: { bookingId },
    }).catch(() => {});

    return updated;
  }

  async cancel(bookingId: string, userId: string, reason?: string) {
    const booking = await this.prisma.transportBooking.findUnique({
      where: { id: bookingId },
      include: {
        request: true,
        quote: { include: { carrier: true } },
      },
    });
    if (!booking) throw new NotFoundException('الحجز غير موجود');

    // Either shipper or carrier can cancel
    const isShipper = booking.request.userId === userId;
    const isCarrier = booking.quote.carrier.userId === userId;
    if (!isShipper && !isCarrier) {
      throw new ForbiddenException('لا يمكنك إلغاء هذا الحجز');
    }

    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      throw new BadRequestException('لا يمكن إلغاء هذا الحجز');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const b = await tx.transportBooking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
      });
      // Issue 4 fix: revert the request to OPEN instead of permanently CANCELLED.
      // A cancelled booking means the deal fell through — the shipper's job still
      // exists and should be available for new quotes rather than being destroyed.
      await tx.transportRequest.update({
        where: { id: booking.requestId },
        data: { status: 'OPEN' },
      });
      return b;
    });

    // Issue 1 fix: flush stale caches (request status reverted to OPEN)
    await this.invalidateRequestCache(booking.requestId);

    // Notify the cancelling party's counterpart
    const otherUserId = isShipper
      ? booking.quote.carrier.userId
      : booking.request.userId;
    await this.notifications.create({
      type: 'TRANSPORT_BOOKING_CANCELLED',
      title: 'تم إلغاء الحجز',
      body: reason ? `تم إلغاء الحجز: ${reason}` : 'تم إلغاء حجز النقل',
      userId: otherUserId,
      data: { bookingId },
    });

    // If the carrier cancelled, tell the shipper their request is open again.
    // Use TRANSPORT_BOOKING_CANCELLED so the user can navigate to the booking
    // and see the request is back to OPEN for new quotes.
    if (isCarrier) {
      this.notifications.create({
        type: 'TRANSPORT_BOOKING_CANCELLED',
        title: 'طلبك متاح مجدداً',
        body: 'ألغى الناقل الحجز — طلبك الآن مفتوح لاستقبال عروض جديدة',
        userId: booking.request.userId,
        data: { bookingId, requestId: booking.requestId },
      }).catch(() => {});
    }

    return updated;
  }

  async getBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.transportBooking.findUnique({
      where: { id: bookingId },
      include: {
        request: { include: { user: { select: USER_SELECT } } },
        quote: { include: { carrier: { include: { user: { select: USER_SELECT } } } } },
      },
    });
    if (!booking) throw new NotFoundException('الحجز غير موجود');

    const isShipper = booking.request.userId === userId;
    const isCarrier = booking.quote.carrier.userId === userId;
    if (!isShipper && !isCarrier) throw new ForbiddenException('ليس لديك صلاحية لعرض هذا الحجز');

    return booking;
  }

  async getMyBookings(
    userId: string,
    role: 'shipper' | 'carrier',
    page = 1,
    limit = DEFAULT_LIMIT,
  ) {
    page = Math.max(1, page);
    limit = Math.min(MAX_LIMIT, Math.max(1, limit));
    const skip = (page - 1) * limit;

    const where =
      role === 'shipper'
        ? { request: { userId } }
        : { quote: { carrier: { userId } } };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transportBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          request: { include: { user: { select: USER_SELECT } } },
          quote: { include: { carrier: { include: { user: { select: USER_SELECT } } } } },
        },
      }),
      this.prisma.transportBooking.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
