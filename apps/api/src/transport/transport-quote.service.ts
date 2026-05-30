import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
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
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Issue 1 fix: invalidate every cached view of a request after any mutation.
   * Called by submitQuote, acceptQuote, and withdrawQuote.
   */
  private async invalidateRequestCache(requestId: string): Promise<void> {
    await Promise.allSettled([
      this.redis.delPattern('transport:list:*'),
      this.redis.del(`transport:request:${requestId}`),
      this.redis.del(`transport:request:${requestId}:auth`),
    ]);
  }

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

    // Issue 6 fix: daily quote rate limit per carrier — checked AFTER all validations
    // so that invalid/duplicate submissions do not consume the carrier's daily quota.
    // Unverified: 20 quotes/day | Verified: 50 quotes/day. Fails open when Redis is down.
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const limitKey = `qlimit:${carrier.id}:${today}`;
    const dailyMax = carrier.isVerified ? 50 : 20;
    const dailyCount = await this.redis.incr(limitKey, 86400); // auto-expires after 24 h
    if (dailyCount > dailyMax) {
      throw new BadRequestException(
        `تجاوزت الحد اليومي للعروض (${dailyMax} عرض/يوم). حاول مرة أخرى غداً.`,
      );
    }

    // Create quote
    let quote;
    try {
      quote = await this.prisma.transportQuote.create({
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
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new BadRequestException('لديك عرض مقدم بالفعل على هذا الطلب');
      }
      throw err;
    }

    // Update request status to QUOTED if still OPEN
    if (request.status === 'OPEN') {
      await this.prisma.transportRequest.update({
        where: { id: requestId },
        data: { status: 'QUOTED' },
      });
    }

    // Issue 1 fix: flush stale list + detail caches so subsequent reads see QUOTED status
    await this.invalidateRequestCache(requestId);

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
    return this.prisma.$transaction(async (tx) => {
      const quote = await tx.transportQuote.findUnique({
        where: { id: quoteId },
        include: { request: true, carrier: true },
      });
      if (!quote) throw new NotFoundException('العرض غير موجود');

      if (quote.request.userId !== userId) {
        throw new ForbiddenException('لا يمكنك قبول عرض على طلب غيرك');
      }

      if (quote.status !== 'PENDING') {
        throw new BadRequestException('لا يمكن قبول هذا العرض');
      }

      if (!['OPEN', 'QUOTED'].includes(quote.request.status)) {
        throw new BadRequestException('لا يمكن قبول عروض على هذا الطلب');
      }

      await tx.transportQuote.update({
        where: { id: quoteId },
        data: { status: 'ACCEPTED' },
      });

      const pendingQuotes = await tx.transportQuote.findMany({
        where: { requestId: quote.requestId, status: 'PENDING', id: { not: quoteId } },
        select: { id: true, carrier: { select: { userId: true } } },
      });

      if (pendingQuotes.length > 0) {
        await tx.transportQuote.updateMany({
          where: { requestId: quote.requestId, status: 'PENDING', id: { not: quoteId } },
          data: { status: 'REJECTED' },
        });
      }

      await tx.transportRequest.update({
        where: { id: quote.requestId },
        data: { status: 'ACCEPTED' },
      });

      const booking = await tx.transportBooking.create({
        data: {
          requestId: quote.requestId,
          quoteId: quote.id,
          status: 'ACCEPTED',
        },
      });

      const conversation = await tx.conversation.create({
        data: {
          entityType: 'TRANSPORT_BOOKING',
          entityId: booking.id,
          participants: {
            create: [
              { userId: quote.request.userId },
              { userId: quote.carrier.userId },
            ],
          },
        },
      });

      const finalBooking = await tx.transportBooking.update({
        where: { id: booking.id },
        data: { conversationId: conversation.id },
        include: {
          request: { include: { user: { select: USER_SELECT } } },
          quote: { include: { carrier: { include: { user: { select: USER_SELECT } } } } },
        },
      });

      return { booking: finalBooking, pendingQuotes };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }).then(async ({ booking, pendingQuotes }) => {
      // Issue 1 fix: flush caches after acceptance (status becomes ACCEPTED)
      await this.invalidateRequestCache(booking.requestId);
      this.sendAcceptanceNotifications(booking, pendingQuotes).catch(() => {});
      return booking;
    });
  }

  private async sendAcceptanceNotifications(booking: any, pendingQuotes: any[]) {
    await this.notifications.create({
      type: 'TRANSPORT_QUOTE_ACCEPTED',
      title: 'تم قبول عرضك',
      body: `تم قبول عرضك على طلب النقل`,
      userId: booking.quote.carrier.userId,
      data: { requestId: booking.requestId, bookingId: booking.id },
    });

    for (const q of pendingQuotes) {
      await this.notifications.create({
        type: 'TRANSPORT_QUOTE_REJECTED',
        title: 'تم رفض عرضك',
        body: 'تم اختيار ناقل آخر للطلب',
        userId: q.carrier.userId,
        data: { requestId: booking.requestId },
      }).catch(() => {});
    }
  }

  async withdrawQuote(quoteId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const quote = await tx.transportQuote.findUnique({
        where: { id: quoteId },
        include: { carrier: true, request: { select: { userId: true } } },
      });
      if (!quote) throw new NotFoundException('العرض غير موجود');

      if (quote.carrier.userId !== userId) {
        throw new ForbiddenException('لا يمكنك سحب عرض غيرك');
      }

      if (quote.status !== 'PENDING') {
        throw new BadRequestException('لا يمكن سحب هذا العرض');
      }

      await tx.transportQuote.update({
        where: { id: quoteId },
        data: { status: 'WITHDRAWN' },
      });

      const pendingCount = await tx.transportQuote.count({
        where: { requestId: quote.requestId, status: 'PENDING' },
      });
      if (pendingCount === 0) {
        await tx.transportRequest.update({
          where: { id: quote.requestId },
          data: { status: 'OPEN' },
        });
      }

      return { message: 'تم سحب العرض بنجاح', requestId: quote.requestId, shipperId: quote.request?.userId };
    }).then(async ({ message, requestId, shipperId }) => {
      // Issue 1 fix: flush caches after withdrawal (status may revert to OPEN)
      await this.invalidateRequestCache(requestId);
      // Notify the shipper so they know a carrier dropped out
      if (shipperId) {
        this.notifications.create({
          type: 'TRANSPORT_QUOTE_REJECTED',
          title: 'سحب عرض سعر',
          body: 'قام أحد الناقلين بسحب عرضه على طلبك',
          userId: shipperId,
          data: { requestId },
        }).catch(() => {});
      }
      return { message };
    });
  }

  /**
   * Returns the calling carrier's own quote for a specific request, or null if
   * they have not submitted one yet. Used by the request detail page so the
   * frontend never has to fetch 200 quotes just to find one match.
   */
  async getMyQuoteForRequest(requestId: string, userId: string) {
    const carrier = await this.prisma.carrierProfile.findUnique({ where: { userId } });
    if (!carrier) return null;

    return this.prisma.transportQuote.findUnique({
      where: { requestId_carrierId: { requestId, carrierId: carrier.id } },
      include: {
        carrier: { include: { user: { select: USER_SELECT } } },
      },
    });
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
