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
import { UpdateTransportRequestDto } from './dto/update-transport-request.dto';
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

  /**
   * L-8 fix: notify matching carriers with a per-carrier daily cap (5/day).
   * Without this, a busy region could spam a carrier dozens of times per day.
   * The Redis key auto-expires after 24 h so the counter resets daily.
   * Fails open — if Redis is unavailable the count returns 0 and the cap is bypassed,
   * which is acceptable (carrier gets notified) versus silently dropping notifications.
   */
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

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const DAILY_LIMIT = 5;

    const notifications = carriers.map(async (c) => {
      // Rate-limit: skip if this carrier already received ≥ DAILY_LIMIT nearby-request alerts today
      const key = `carrier:newreq:notify:${c.userId}:${today}`;
      const count = await this.redis.incr(key, 86400).catch(() => 0);
      if (count > DAILY_LIMIT) return;

      return this.notifications.create({
        type: 'SYSTEM',
        title: 'طلب نقل جديد قريب منك',
        body: `طلب ${request.serviceType} من ${request.fromGovernorate} إلى ${request.toGovernorate}`,
        userId: c.userId,
        data: { requestId: request.id },
      });
    });

    await Promise.allSettled(notifications);
  }

  async findAll(query: QueryTransportRequestsDto) {
    const cacheKey = `transport:list:${JSON.stringify(query)}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    // Issue 3 fix: stampede protection.
    // Acquire a short-lived lock so only one concurrent request hits the DB
    // for the same cache key. Others wait briefly, then retry the cache.
    const lockKey = `lock:${cacheKey}`;
    const isLeader = await this.redis.setNX(lockKey, '1', 15);
    // Issue 3 fix: only wait when Redis is healthy — if it is down the lock is
    // meaningless and the 200 ms delay would be wasted on every cache miss.
    if (!isLeader && this.redis.isReady()) {
      await new Promise((r) => setTimeout(r, 200));
      const retried = await this.redis.get<any>(cacheKey);
      if (retried) return retried;
      // Still cold after wait — fall through so this request also computes it
    }

    try {
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit || String(DEFAULT_LIMIT), 10)));
      const skip = (page - 1) * limit;

      const where: Prisma.TransportRequestWhereInput = {};

      where.status = (query.status as any) || 'OPEN';
      if (query.serviceType) where.serviceType = query.serviceType as any;
      if (query.fromGovernorate) where.fromGovernorate = query.fromGovernorate;
      if (query.fromCity) where.fromCity = query.fromCity;
      if (query.fromWilayat) where.fromCity = query.fromWilayat;
      if (query.toGovernorate) where.toGovernorate = query.toGovernorate;
      if (query.toCity) where.toCity = query.toCity;
      if (query.toWilayat) where.toCity = query.toWilayat;
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
    } finally {
      if (isLeader) await this.redis.del(lockKey);
    }
  }

  async findOne(id: string, ip?: string, userId?: string) {
    // Separate cache keys so anonymous responses never contain booking data
    const cacheKey = userId ? `transport:request:${id}:auth` : `transport:request:${id}`;
    const cached = await this.redis.get<any>(cacheKey);

    let request = cached;
    if (!request) {
      // Issue 3 fix: stampede protection on detail cache miss
      const lockKey = `lock:${cacheKey}`;
      const isLeader = await this.redis.setNX(lockKey, '1', 10);
      if (!isLeader && this.redis.isReady()) {
        await new Promise((r) => setTimeout(r, 150));
        const retried = await this.redis.get<any>(cacheKey);
        if (retried) {
          request = retried;
        }
      }

      if (!request) {
        request = await this.prisma.transportRequest.findUnique({
          where: { id },
          include: {
            user: { select: USER_SELECT },
            _count: { select: { quotes: true } },
            ...(userId ? { booking: true } : {}),
          },
        });
        if (request) await this.redis.set(cacheKey, request, DETAIL_CACHE_TTL);
      }

      if (isLeader) await this.redis.del(lockKey);
    }

    if (!request) throw new NotFoundException('طلب النقل غير موجود');

    // Issue 2 fix: fire-and-forget — view count is analytical, must not block
    // the user-facing response. Rate-limiting (1/IP/hour) is handled by the helper.
    const shouldCount = await incrementViewCount(this.redis, 'TRANSPORT_REQUEST', id, ip);
    if (shouldCount) {
      this.prisma.transportRequest.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      }).catch((err) => this.logger.warn(`viewCount update failed for ${id}: ${err.message}`));
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

    const pendingQuotes = await this.prisma.transportQuote.findMany({
      where: { requestId: id, status: 'PENDING' },
      include: { carrier: true },
    });

    const updated = await this.prisma.transportRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    if (pendingQuotes.length > 0) {
      await this.prisma.transportQuote.updateMany({
        where: { id: { in: pendingQuotes.map((q) => q.id) } },
        data: { status: 'REJECTED' },
      });

      const notifications = pendingQuotes.map((q) =>
        this.notifications.create({
          type: 'TRANSPORT_REQUEST_CANCELLED',
          title: 'إلغاء طلب نقل',
          body: 'تم إلغاء طلب النقل الذي قدمت عرضاً عليه',
          userId: q.carrier.userId,
          data: { requestId: id },
        }),
      );
      await Promise.allSettled(notifications);
    }

    await this.redis.delPattern('transport:list:*');
    await this.redis.del(`transport:request:${id}`);
    await this.redis.del(`transport:request:${id}:auth`);

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
          user: { select: USER_SELECT },
        },
      }),
      this.prisma.transportRequest.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(id: string, userId: string, dto: UpdateTransportRequestDto) {
    const request = await this.prisma.transportRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('طلب النقل غير موجود');
    if (request.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل طلب غيرك');
    
    if (!['OPEN', 'QUOTED'].includes(request.status)) {
      throw new BadRequestException('لا يمكن تعديل هذا الطلب في حالته الحالية');
    }

    const updated = await this.prisma.transportRequest.update({
      where: { id },
      data: {
        ...(dto.serviceType && { serviceType: dto.serviceType }),
        ...(dto.fromGovernorate && { fromGovernorate: dto.fromGovernorate }),
        ...(dto.fromCity && { fromCity: dto.fromCity }),
        ...(dto.fromAddress && { fromAddress: dto.fromAddress }),
        ...(dto.fromLat !== undefined && { fromLat: dto.fromLat }),
        ...(dto.fromLng !== undefined && { fromLng: dto.fromLng }),
        ...(dto.toGovernorate && { toGovernorate: dto.toGovernorate }),
        ...(dto.toCity && { toCity: dto.toCity }),
        ...(dto.toAddress && { toAddress: dto.toAddress }),
        ...(dto.toLat !== undefined && { toLat: dto.toLat }),
        ...(dto.toLng !== undefined && { toLng: dto.toLng }),
        ...(dto.cargoDescription && { cargoDescription: dto.cargoDescription }),
        ...(dto.weightTons !== undefined && { weightTons: dto.weightTons }),
        ...(dto.requiresHelper !== undefined && { requiresHelper: dto.requiresHelper }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.isFlexible !== undefined && { isFlexible: dto.isFlexible }),
        ...(dto.budgetMin !== undefined && { budgetMin: new Prisma.Decimal(dto.budgetMin) }),
        ...(dto.budgetMax !== undefined && { budgetMax: new Prisma.Decimal(dto.budgetMax) }),
      },
    });

    await this.redis.delPattern('transport:list:*');
    await this.redis.del(`transport:request:${id}`);
    await this.redis.del(`transport:request:${id}:auth`);

    return updated;
  }

  async repost(id: string, userId: string) {
    const request = await this.prisma.transportRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('طلب النقل غير موجود');
    if (request.userId !== userId) throw new ForbiddenException('لا يمكنك إعادة نشر طلب غيرك');

    if (request.status !== 'EXPIRED') {
      throw new BadRequestException('يمكن إعادة نشر الطلبات المنتهية فقط');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const updated = await this.prisma.transportRequest.update({
      where: { id },
      data: {
        status: 'OPEN',
        expiresAt,
      },
    });

    await this.redis.delPattern('transport:list:*');
    await this.redis.del(`transport:request:${id}`);
    await this.redis.del(`transport:request:${id}:auth`);

    return updated;
  }
}
