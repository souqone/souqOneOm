import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTransportRequestDto } from './dto/create-transport-request.dto';
import { QueryTransportRequestsDto } from './dto/query-transport-requests.dto';
import { Prisma } from '@prisma/client';
import { incrementViewCount } from '../common/utils/view-count.helper';

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  isVerified: true,
};

const LIST_CACHE_TTL = 300;
const DETAIL_CACHE_TTL = 600;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

@Injectable()
export class TransportRequestService {
  private readonly logger = new Logger(TransportRequestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateTransportRequestDto) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const request = await this.prisma.transportRequest.create({
      data: {
        userId,
        serviceType: dto.serviceType,
        fromGovernorate: dto.fromGovernorate,
        fromCity: dto.fromCity,
        fromAddress: dto.fromAddress,
        fromLat: dto.fromLat,
        fromLng: dto.fromLng,
        toGovernorate: dto.toGovernorate,
        toCity: dto.toCity,
        toAddress: dto.toAddress,
        toLat: dto.toLat,
        toLng: dto.toLng,
        cargoDescription: dto.cargoDescription,
        weightTons: dto.weightTons,
        requiresHelper: dto.requiresHelper ?? false,
        notes: dto.notes,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        isFlexible: dto.isFlexible ?? false,
        budgetMin: dto.budgetMin ? new Prisma.Decimal(dto.budgetMin) : undefined,
        budgetMax: dto.budgetMax ? new Prisma.Decimal(dto.budgetMax) : undefined,
        expiresAt,
      },
      include: { user: { select: USER_SELECT } },
    });

    // Notify matching available carriers
    this.notifyMatchingCarriers(request).catch((err) =>
      this.logger.error(`فشل إرسال الإشعارات للناقلين: ${err.message}`),
    );

    // Invalidate list cache
    await this.redis.delPattern('transport:list:*');

    return request;
  }

  private async notifyMatchingCarriers(request: {
    id: string;
    serviceType: string;
    fromGovernorate: string;
    toGovernorate: string;
  }) {
    const carriers = await this.prisma.carrierProfile.findMany({
      where: {
        governorate: request.fromGovernorate,
        serviceTypes: { has: request.serviceType as any },
        isAvailable: true,
      },
      select: { userId: true },
      take: 30,
    });

    const notifications = carriers.map((c) =>
      this.notifications.create({
        type: 'SYSTEM',
        title: 'طلب نقل جديد قريب منك',
        body: `طلب ${request.serviceType} من ${request.fromGovernorate} إلى ${request.toGovernorate}`,
        userId: c.userId,
        data: { requestId: request.id },
      }),
    );

    await Promise.allSettled(notifications);
  }

  async findAll(query: QueryTransportRequestsDto) {
    const cacheKey = `transport:list:${JSON.stringify(query)}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit || String(DEFAULT_LIMIT), 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.TransportRequestWhereInput = {};

    where.status = (query.status as any) || 'OPEN';
    if (query.serviceType) where.serviceType = query.serviceType as any;
    if (query.fromGovernorate) where.fromGovernorate = query.fromGovernorate;
    if (query.toGovernorate) where.toGovernorate = query.toGovernorate;
    if (query.userId) where.userId = query.userId;

    const orderBy: Prisma.TransportRequestOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    if (sortField === 'budgetMax') orderBy.budgetMax = sortOrder;
    else if (sortField === 'scheduledAt') orderBy.scheduledAt = sortOrder;
    else orderBy.createdAt = sortOrder;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transportRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: { select: USER_SELECT },
          _count: { select: { quotes: true } },
        },
      }),
      this.prisma.transportRequest.count({ where }),
    ]);

    const result = {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };

    await this.redis.set(cacheKey, result, LIST_CACHE_TTL);
    return result;
  }

  async findOne(id: string, ip?: string) {
    const cacheKey = `transport:request:${id}`;
    const cached = await this.redis.get<any>(cacheKey);

    const request = cached || await this.prisma.transportRequest.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
        _count: { select: { quotes: true } },
        booking: true,
      },
    });

    if (!request) throw new NotFoundException('طلب النقل غير موجود');

    if (!cached) await this.redis.set(cacheKey, request, DETAIL_CACHE_TTL);

    // Rate-limited view count
    const shouldCount = await incrementViewCount(this.redis, 'TRANSPORT_REQUEST', id, ip);
    if (shouldCount) {
      await this.prisma.transportRequest.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return request;
  }

  async cancel(id: string, userId: string) {
    const request = await this.prisma.transportRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('طلب النقل غير موجود');
    if (request.userId !== userId) throw new ForbiddenException('لا يمكنك إلغاء طلب غيرك');
    if (!['OPEN', 'QUOTED'].includes(request.status)) {
      throw new BadRequestException('لا يمكن إلغاء هذا الطلب في حالته الحالية');
    }

    const updated = await this.prisma.transportRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.redis.delPattern('transport:list:*');
    await this.redis.del(`transport:request:${id}`);

    return updated;
  }

  async myRequests(userId: string, page = 1, limit = DEFAULT_LIMIT, status?: string) {
    page = Math.max(1, page);
    limit = Math.min(MAX_LIMIT, Math.max(1, limit));
    const skip = (page - 1) * limit;

    const where: Prisma.TransportRequestWhereInput = {
      userId,
      ...(status ? { status: status as Prisma.EnumTransportRequestStatusFilter } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transportRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { quotes: true } },
          booking: true,
        },
      }),
      this.prisma.transportRequest.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
