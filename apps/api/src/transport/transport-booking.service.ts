import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
    private readonly notifications: NotificationsService,
  ) {}

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

    // Notify shipper
    await this.notifications.create({
      type: 'TRANSPORT_BOOKING_CONFIRMED',
      title: 'بدأ النقل',
      body: 'الناقل بدأ في تنفيذ طلبك',
      userId: booking.request.userId,
      data: { bookingId },
    });

    return updated;
  }

  async complete(bookingId: string, shipperId: string) {
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
        data: { status: 'COMPLETED', completedAt: new Date() },
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

    // Notify carrier
    await this.notifications.create({
      type: 'TRANSPORT_REQUEST_CLOSED',
      title: 'تم إتمام الطلب',
      body: 'تم تأكيد إتمام طلب النقل بنجاح',
      userId: booking.quote.carrier.userId,
      data: { bookingId },
    });

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
      await tx.transportRequest.update({
        where: { id: booking.requestId },
        data: { status: 'CANCELLED' },
      });
      return b;
    });

    // Notify the other party
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

    return updated;
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
