import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { Prisma } from '@prisma/client';

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
export class TransportQuoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async submitQuote(requestId: string, userId: string, dto: CreateQuoteDto) {
    // Find carrier profile
    const carrier = await this.prisma.carrierProfile.findUnique({ where: { userId } });
    if (!carrier) throw new NotFoundException('يجب إنشاء ملف ناقل أولاً');

    // Find request
    const request = await this.prisma.transportRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('طلب النقل غير موجود');

    // Validate status
    if (!['OPEN', 'QUOTED'].includes(request.status)) {
      throw new BadRequestException('لا يمكن تقديم عرض على هذا الطلب');
    }

    // Cannot quote own request
    if (request.userId === userId) {
      throw new ForbiddenException('لا يمكنك تقديم عرض على طلبك');
    }

    // Check duplicate
    const existing = await this.prisma.transportQuote.findUnique({
      where: { requestId_carrierId: { requestId, carrierId: carrier.id } },
    });
    if (existing) throw new BadRequestException('لديك عرض مقدم بالفعل على هذا الطلب');

    // Create quote
    const quote = await this.prisma.transportQuote.create({
      data: {
        requestId,
        carrierId: carrier.id,
        price: new Prisma.Decimal(dto.price),
        estimatedHours: dto.estimatedHours,
        message: dto.message,
      },
      include: {
        carrier: { include: { user: { select: USER_SELECT } } },
      },
    });

    // Update request status to QUOTED if still OPEN
    if (request.status === 'OPEN') {
      await this.prisma.transportRequest.update({
        where: { id: requestId },
        data: { status: 'QUOTED' },
      });
    }

    // Notify shipper
    await this.notifications.create({
      type: 'TRANSPORT_QUOTE_RECEIVED',
      title: 'عرض سعر جديد',
      body: `وصلك عرض بسعر ${dto.price} ر.ع.`,
      userId: request.userId,
      data: { requestId, quoteId: quote.id },
    });

    return quote;
  }

  async getQuotesForRequest(requestId: string, userId: string) {
    // Only request owner can view quotes
    const request = await this.prisma.transportRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('طلب النقل غير موجود');
    if (request.userId !== userId) throw new ForbiddenException('لا يمكنك عرض عروض طلب غيرك');

    return this.prisma.transportQuote.findMany({
      where: { requestId },
      orderBy: { price: 'asc' },
      include: {
        carrier: { include: { user: { select: USER_SELECT } } },
      },
    });
  }

  async acceptQuote(quoteId: string, userId: string) {
    const quote = await this.prisma.transportQuote.findUnique({
      where: { id: quoteId },
      include: { request: true, carrier: true },
    });
    if (!quote) throw new NotFoundException('العرض غير موجود');

    // Only request owner can accept
    if (quote.request.userId !== userId) {
      throw new ForbiddenException('لا يمكنك قبول عرض على طلب غيرك');
    }

    // Quote must be pending
    if (quote.status !== 'PENDING') {
      throw new BadRequestException('لا يمكن قبول هذا العرض');
    }

    // Request must be OPEN or QUOTED
    if (!['OPEN', 'QUOTED'].includes(quote.request.status)) {
      throw new BadRequestException('لا يمكن قبول عروض على هذا الطلب');
    }

    // Transaction: accept quote, reject others, update request, create booking
    const booking = await this.prisma.$transaction(async (tx) => {
      // Accept this quote
      await tx.transportQuote.update({
        where: { id: quoteId },
        data: { status: 'ACCEPTED' },
      });

      // Reject all other pending quotes
      await tx.transportQuote.updateMany({
        where: {
          requestId: quote.requestId,
          id: { not: quoteId },
          status: 'PENDING',
        },
        data: { status: 'REJECTED' },
      });

      // Update request status
      await tx.transportRequest.update({
        where: { id: quote.requestId },
        data: { status: 'ACCEPTED' },
      });

      // Create booking
      return tx.transportBooking.create({
        data: {
          requestId: quote.requestId,
          quoteId: quote.id,
        },
        include: {
          request: { include: { user: { select: USER_SELECT } } },
          quote: { include: { carrier: { include: { user: { select: USER_SELECT } } } } },
        },
      });
    });

    // Notify accepted carrier
    await this.notifications.create({
      type: 'TRANSPORT_BOOKING_CONFIRMED',
      title: 'تم قبول عرضك',
      body: 'تم قبول عرضك على طلب النقل',
      userId: quote.carrier.userId,
      data: { requestId: quote.requestId, bookingId: booking.id },
    });

    return booking;
  }

  async withdrawQuote(quoteId: string, userId: string) {
    const quote = await this.prisma.transportQuote.findUnique({
      where: { id: quoteId },
      include: { carrier: true },
    });
    if (!quote) throw new NotFoundException('العرض غير موجود');

    // Only the carrier who submitted can withdraw
    if (quote.carrier.userId !== userId) {
      throw new ForbiddenException('لا يمكنك سحب عرض غيرك');
    }

    if (quote.status !== 'PENDING') {
      throw new BadRequestException('لا يمكن سحب هذا العرض');
    }

    await this.prisma.transportQuote.update({
      where: { id: quoteId },
      data: { status: 'WITHDRAWN' },
    });

    // Check if no more pending quotes → revert request to OPEN
    const pendingCount = await this.prisma.transportQuote.count({
      where: { requestId: quote.requestId, status: 'PENDING' },
    });
    if (pendingCount === 0) {
      await this.prisma.transportRequest.update({
        where: { id: quote.requestId },
        data: { status: 'OPEN' },
      });
    }

    return { message: 'تم سحب العرض بنجاح' };
  }

  async getMyQuotes(userId: string, page = 1, limit = DEFAULT_LIMIT, status?: string) {
    const carrier = await this.prisma.carrierProfile.findUnique({ where: { userId } });
    if (!carrier) throw new NotFoundException('يجب إنشاء ملف ناقل أولاً');

    page = Math.max(1, page);
    limit = Math.min(MAX_LIMIT, Math.max(1, limit));
    const skip = (page - 1) * limit;

    const where: Prisma.TransportQuoteWhereInput = {
      carrierId: carrier.id,
      ...(status ? { status: status as Prisma.EnumQuoteStatusFilter } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transportQuote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          request: {
            include: { user: { select: USER_SELECT } },
          },
          booking: { select: { id: true } },
        },
      }),
      this.prisma.transportQuote.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
