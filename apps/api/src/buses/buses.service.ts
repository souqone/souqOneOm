import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ListingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchService, INDEXES } from '../search/search.service';
import { CreateBusListingDto } from './dto/create-bus-listing.dto';
import { UpdateBusListingDto } from './dto/update-bus-listing.dto';
import { CreateBusOfferDto } from './dto/create-bus-offer.dto';
import { UpdateBusOfferDto } from './dto/update-bus-offer.dto';
import { QueryBusListingsDto } from './dto/query-bus-listings.dto';
import { generateSlug, USER_SELECT } from '../common/utils/entity.utils';

const VIEW_COOLDOWN_SECONDS = 3600; // 1 view per IP per listing per hour
const LIST_CACHE_TTL = 300;   // 5 min
const DETAIL_CACHE_TTL = 600; // 10 min

const ALLOWED_TRANSITIONS: Record<string, ListingStatus[]> = {
  DRAFT:     ['ACTIVE'],
  ACTIVE:    ['SOLD', 'RENTED', 'ARCHIVED', 'SUSPENDED'],
  ARCHIVED:  ['ACTIVE'],
  RENTED:    ['ACTIVE'],
  SOLD:      [],
  SUSPENDED: [],
};

@Injectable()
export class BusesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
    private readonly search: SearchService,
  ) {}

  async getManufacturers() {
    return this.prisma.busManufacturer.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, nameAr: true, country: true },
    });
  }

  async getModelsByManufacturer(manufacturerId: string) {
    return this.prisma.busModel.findMany({
      where: { manufacturerId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, nameAr: true, busType: true, capacity: true },
    });
  }

  private buildMeiliDoc(bus: any): Record<string, any> {
    return {
      id: bus.id,
      title: bus.title,
      slug: bus.slug,
      description: bus.description,
      busListingType: bus.busListingType,
      busType: bus.busType,
      make: bus.make,
      model: bus.model,
      price: bus.price ? Number(bus.price) : null,
      capacity: bus.capacity,
      governorate: bus.governorate,
      status: bus.status,
      isPremium: bus.isPremium,
      viewCount: bus.viewCount,
      imageUrl: bus.images?.[0]?.url || null,
      createdAt: bus.createdAt instanceof Date ? bus.createdAt.getTime() : bus.createdAt,
    };
  }


  async create(dto: CreateBusListingDto, userId: string) {
    const slug = generateSlug(dto.title);

    const bus = await this.prisma.busListing.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        busListingType: dto.busListingType,
        busType: dto.busType,
        make: dto.make,
        model: dto.model,
        manufacturerId: dto.manufacturerId,
        modelId: dto.modelId,
        year: dto.year,
        capacity: dto.capacity,
        mileage: dto.mileage,
        fuelType: dto.fuelType,
        transmission: dto.transmission,
        condition: dto.condition ?? 'USED',
        features: dto.features ?? [],
        plateNumber: dto.plateNumber,
        price: dto.price != null ? new Prisma.Decimal(dto.price) : null,
        currency: dto.currency ?? 'OMR',
        isPriceNegotiable: dto.isPriceNegotiable ?? false,
        contractType: dto.contractType,
        contractClient: dto.contractClient,
        contractMonthly: dto.contractMonthly != null ? new Prisma.Decimal(dto.contractMonthly) : null,
        contractDuration: dto.contractDuration,
        contractExpiry: dto.contractExpiry ? new Date(dto.contractExpiry) : null,
        dailyPrice: dto.dailyPrice != null ? new Prisma.Decimal(dto.dailyPrice) : null,
        monthlyPrice: dto.monthlyPrice != null ? new Prisma.Decimal(dto.monthlyPrice) : null,
        minRentalDays: dto.minRentalDays,
        withDriver: dto.withDriver ?? false,
        deliveryAvailable: dto.deliveryAvailable ?? false,
        requestPassengers: dto.requestPassengers,
        requestRoute: dto.requestRoute,
        requestSchedule: dto.requestSchedule,
        governorate: dto.governorate,
        city: dto.city,
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactPhone: dto.contactPhone,
        whatsapp: dto.whatsapp,
        userId,
      },
      include: {
        user: { select: USER_SELECT },
        images: true,
      },
    });

    await this.invalidateCache();
    this.search.indexDocument(INDEXES.BUSES, this.buildMeiliDoc(bus)).catch(() => {});

    // Async: notify sellers in same governorate when a REQUEST is created
    if (bus.busListingType === 'BUS_REQUEST' && bus.governorate) {
      this.notifySellersInArea(bus.id, bus.title, bus.governorate, userId);
    }

    return bus;
  }

  private notifySellersInArea(listingId: string, title: string, governorate: string, requesterId: string) {
    Promise.resolve().then(async () => {
      try {
        const sellers = await this.prisma.busListing.findMany({
          where: {
            governorate,
            status: 'ACTIVE',
            busListingType: { in: ['BUS_SALE', 'BUS_RENT', 'BUS_CONTRACT', 'BUS_SALE_WITH_CONTRACT'] },
            userId: { not: requesterId },
          },
          select: { userId: true },
          distinct: ['userId'],
        });

        for (const s of sellers) {
          await this.notifications.create({
            type: 'SYSTEM',
            title: '\u0637\u0644\u0628 \u062d\u0627\u0641\u0644\u0629 \u0641\u064a \u0645\u0646\u0637\u0642\u062a\u0643',
            body: title,
            userId: s.userId,
            data: { link: `/buses/${listingId}` },
          });
        }
      } catch {
        // Fire & forget — don't crash the main flow
      }
    });
  }

  private cacheKey(suffix: string) { return `busListing:${suffix}`; }

  private async invalidateCache(id?: string) {
    await this.redis.delPattern('busListing:list:*');
    if (id) {
      await this.redis.del(this.cacheKey(`detail:${id}`));
      await this.redis.del(this.cacheKey(`slug:*`));
    }
  }

  async findAll(query: QueryBusListingsDto) {
    const page = parseInt(query.page ?? '1');
    const limit = Math.min(parseInt(query.limit ?? '20'), 50);
    const skip = (page - 1) * limit;

    const queryHash = Buffer.from(JSON.stringify(query)).toString('base64url');
    const cKey = this.cacheKey(`list:${queryHash}`);
    const cached = await this.redis.get<any>(cKey);
    if (cached) return cached;

    const where: Prisma.BusListingWhereInput = { status: 'ACTIVE', deletedAt: null };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { make: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.busListingType) where.busListingType = query.busListingType;
    if (query.busType) where.busType = query.busType;
    if (query.make) where.make = { contains: query.make, mode: 'insensitive' };
    if (query.governorate) where.governorate = query.governorate;
    if (query.userId) where.userId = query.userId;

    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = new Prisma.Decimal(query.minPrice);
      if (query.maxPrice) where.price.lte = new Prisma.Decimal(query.maxPrice);
    }

    if (query.minCapacity || query.maxCapacity) {
      where.capacity = {};
      if (query.minCapacity) where.capacity.gte = parseInt(query.minCapacity);
      if (query.maxCapacity) where.capacity.lte = parseInt(query.maxCapacity);
    }

    let orderBy: Prisma.BusListingOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sort === 'price_asc') orderBy = { price: 'asc' };
    else if (query.sort === 'price_desc') orderBy = { price: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.busListing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: { select: USER_SELECT },
          images: { orderBy: { order: 'asc' }, take: 1 },
        },
      }),
      this.prisma.busListing.count({ where }),
    ]);

    const result = { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    await this.redis.set(cKey, result, LIST_CACHE_TTL);
    return result;
  }

  async findOne(id: string, ip?: string) {
    const cKey = this.cacheKey(`detail:${id}`);
    const cached = await this.redis.get<any>(cKey);
    if (cached) {
      await this.incrementViewIfAllowed(id, ip);
      return cached;
    }

    const bus = await this.prisma.busListing.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: USER_SELECT },
        images: { orderBy: { order: 'asc' } },
      },
    });
    if (!bus) throw new NotFoundException('إعلان الحافلة غير موجود');

    await this.redis.set(cKey, bus, DETAIL_CACHE_TTL);
    await this.incrementViewIfAllowed(bus.id, ip);
    return bus;
  }

  async findBySlug(slug: string, ip?: string) {
    const cKey = this.cacheKey(`slug:${slug}`);
    const cached = await this.redis.get<any>(cKey);
    if (cached) {
      await this.incrementViewIfAllowed(cached.id, ip);
      return cached;
    }

    const bus = await this.prisma.busListing.findFirst({
      where: { slug, deletedAt: null },
      include: {
        user: { select: USER_SELECT },
        images: { orderBy: { order: 'asc' } },
      },
    });
    if (!bus) throw new NotFoundException('إعلان الحافلة غير موجود');

    await this.redis.set(cKey, bus, DETAIL_CACHE_TTL);
    await this.incrementViewIfAllowed(bus.id, ip);
    return bus;
  }

  private async incrementViewIfAllowed(listingId: string, ip?: string) {
    if (!ip) {
      // No IP available — increment anyway (graceful degradation)
      await this.prisma.busListing.update({ where: { id: listingId }, data: { viewCount: { increment: 1 } } });
      return;
    }

    const key = `bus:view:${ip}:${listingId}`;
    const isNew = await this.redis.setNX(key, '1', VIEW_COOLDOWN_SECONDS);

    if (isNew) {
      await this.prisma.busListing.update({ where: { id: listingId }, data: { viewCount: { increment: 1 } } });
    }
    // If key already existed (isNew === false), skip increment — already counted this hour
  }

  async myListings(userId: string, page = 1, limit = 20) {
    limit = Math.min(limit, 50);
    const skip = (page - 1) * limit;
    const where = { userId };

    const [items, total] = await Promise.all([
      this.prisma.busListing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { images: { orderBy: { order: 'asc' }, take: 1 } },
      }),
      this.prisma.busListing.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async update(id: string, userId: string, dto: UpdateBusListingDto) {
    const bus = await this.prisma.busListing.findUnique({ where: { id } });
    if (!bus) throw new NotFoundException('إعلان الحافلة غير موجود');
    if (bus.userId !== userId) throw new ForbiddenException('غير مصرح لك بتعديل هذا الإعلان');

    // Status state machine validation
    if (dto.status) {
      const allowed = ALLOWED_TRANSITIONS[bus.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `INVALID_STATUS_TRANSITION: ${bus.status} → ${dto.status}`,
        );
      }
    }

    // Log status transition
    const statusChanged = dto.status && dto.status !== bus.status;

    const DECIMAL_FIELDS = ['price', 'contractMonthly', 'dailyPrice', 'monthlyPrice'];
    const DATE_FIELDS = ['contractExpiry'];

    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined) continue;
      if (DECIMAL_FIELDS.includes(key)) {
        data[key] = new Prisma.Decimal(value as number);
      } else if (DATE_FIELDS.includes(key)) {
        data[key] = new Date(value as string);
      } else {
        data[key] = value;
      }
    }

    const updated = await this.prisma.busListing.update({
      where: { id },
      data,
      include: {
        user: { select: USER_SELECT },
        images: { orderBy: { order: 'asc' } },
      },
    });

    if (statusChanged) {
      await this.prisma.busListingStatusLog.create({
        data: {
          busListingId: id,
          fromStatus: bus.status,
          toStatus: dto.status!,
          changedBy: userId,
        },
      });
    }

    // Price audit trail
    if (dto.price !== undefined && String(dto.price) !== String(bus.price)) {
      await this.prisma.busListingPriceHistory.create({
        data: {
          busListingId: id,
          oldPrice: bus.price,
          newPrice: new Prisma.Decimal(dto.price),
          changedBy: userId,
        },
      });
    }

    await this.invalidateCache(id);
    this.search.indexDocument(INDEXES.BUSES, this.buildMeiliDoc(updated)).catch(() => {});

    return updated;
  }

  async remove(id: string, userId: string) {
    const bus = await this.prisma.busListing.findUnique({ where: { id } });
    if (!bus) throw new NotFoundException('إعلان الحافلة غير موجود');
    if (bus.userId !== userId) throw new ForbiddenException('غير مصرح لك بحذف هذا الإعلان');

    await this.prisma.busListing.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.invalidateCache(id);
    this.search.removeDocument(INDEXES.BUSES, id).catch(() => {});

    // Clean up orphaned conversations & favorites
    await this.prisma.cleanupPolymorphicOrphans('BUS_LISTING', id);

    return { message: 'تم حذف الإعلان بنجاح' };
  }

  async addImages(id: string, userId: string, urls: string[]) {
    const bus = await this.prisma.busListing.findUnique({ where: { id } });
    if (!bus) throw new NotFoundException('إعلان الحافلة غير موجود');
    if (bus.userId !== userId) throw new ForbiddenException('غير مصرح');

    const existing = await this.prisma.busListingImage.count({ where: { busListingId: id } });

    const images = await this.prisma.$transaction(
      urls.map((url, i) =>
        this.prisma.busListingImage.create({
          data: {
            url,
            order: existing + i,
            isPrimary: existing === 0 && i === 0,
            busListingId: id,
          },
        }),
      ),
    );

    return images;
  }

  async removeImage(imageId: string, userId: string) {
    const image = await this.prisma.busListingImage.findUnique({
      where: { id: imageId },
      include: { busListing: { select: { userId: true } } },
    });
    if (!image) throw new NotFoundException('الصورة غير موجودة');
    if (image.busListing.userId !== userId) throw new ForbiddenException('غير مصرح');

    await this.prisma.busListingImage.delete({ where: { id: imageId } });

    // Reindex remaining image orders
    const remaining = await this.prisma.busListingImage.findMany({
      where: { busListingId: image.busListingId },
      orderBy: { order: 'asc' },
    });
    if (remaining.length > 0) {
      await this.prisma.$transaction(
        remaining.map((img, i) =>
          this.prisma.busListingImage.update({
            where: { id: img.id },
            data: { order: i, isPrimary: i === 0 },
          }),
        ),
      );
    }

    return { message: 'تم حذف الصورة' };
  }

  // ════════════════════════════════════════════
  // Offer methods (Phase 3)
  // ════════════════════════════════════════════

  async createOffer(listingId: string, sellerUserId: string, dto: CreateBusOfferDto) {
    const listing = await this.prisma.busListing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('إعلان الحافلة غير موجود');
    if (listing.busListingType !== 'BUS_REQUEST') {
      throw new BadRequestException('لا يمكن تقديم عرض إلا على طلب حافلة');
    }
    if (listing.userId === sellerUserId) {
      throw new BadRequestException('لا يمكنك تقديم عرض على طلبك الخاص');
    }

    const existing = await this.prisma.busListingOffer.findUnique({
      where: { requestListingId_sellerUserId: { requestListingId: listingId, sellerUserId } },
    });
    if (existing) throw new BadRequestException('لقد قدمت عرضاً بالفعل على هذا الطلب');

    const offer = await this.prisma.busListingOffer.create({
      data: {
        message: dto.message,
        proposedPrice: dto.proposedPrice != null ? new Prisma.Decimal(dto.proposedPrice) : null,
        requestListingId: listingId,
        sellerUserId,
      },
      include: { seller: { select: USER_SELECT } },
    });

    // Async: notify the requester
    Promise.resolve().then(async () => {
      try {
        await this.notifications.create({
          type: 'SYSTEM',
          title: 'عرض جديد على طلبك',
          body: dto.message || 'تم تقديم عرض جديد على طلب الحافلة',
          userId: listing.userId,
          data: { link: `/buses/${listingId}` },
        });
      } catch {
        // Fire & forget
      }
    });

    return offer;
  }

  async getOffers(listingId: string, userId: string) {
    const listing = await this.prisma.busListing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('إعلان الحافلة غير موجود');
    if (listing.userId !== userId) throw new ForbiddenException('غير مصرح لك بعرض العروض');

    return this.prisma.busListingOffer.findMany({
      where: { requestListingId: listingId },
      include: { seller: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOffer(offerId: string, userId: string, dto: UpdateBusOfferDto) {
    const offer = await this.prisma.busListingOffer.findUnique({
      where: { id: offerId },
      include: { requestListing: { select: { userId: true, id: true } } },
    });
    if (!offer) throw new NotFoundException('العرض غير موجود');
    if (offer.requestListing.userId !== userId) {
      throw new ForbiddenException('فقط صاحب الطلب يمكنه قبول أو رفض العروض');
    }

    // Rule: ACCEPTED → REJECTED not allowed
    if (offer.status === 'ACCEPTED') {
      throw new BadRequestException('لا يمكن تغيير حالة عرض تم قبوله');
    }

    // Rule: Max 1 ACCEPTED per request
    if (dto.status === 'ACCEPTED') {
      const alreadyAccepted = await this.prisma.busListingOffer.findFirst({
        where: { requestListingId: offer.requestListingId, status: 'ACCEPTED' },
      });
      if (alreadyAccepted) {
        throw new BadRequestException('يوجد عرض مقبول بالفعل على هذا الطلب');
      }
    }

    const updated = await this.prisma.busListingOffer.update({
      where: { id: offerId },
      data: { status: dto.status },
      include: { seller: { select: USER_SELECT } },
    });

    // When accepted, archive the request
    if (dto.status === 'ACCEPTED') {
      await this.prisma.busListing.update({
        where: { id: offer.requestListingId },
        data: { status: 'ARCHIVED' },
      });
    }

    // Notify the seller about the decision
    Promise.resolve().then(async () => {
      try {
        const statusText = dto.status === 'ACCEPTED' ? 'تم قبول عرضك' : 'تم رفض عرضك';
        await this.notifications.create({
          type: 'SYSTEM',
          title: statusText,
          body: `${statusText} على طلب الحافلة`,
          userId: offer.sellerUserId,
          data: { link: `/buses/${offer.requestListingId}` },
        });
      } catch {
        // Fire & forget
      }
    });

    return updated;
  }

  // ════════════════════════════════════════════
  // Observability (Phase 4)
  // ════════════════════════════════════════════

  async getStatusHistory(listingId: string, userId: string) {
    const listing = await this.prisma.busListing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('إعلان الحافلة غير موجود');
    if (listing.userId !== userId) throw new ForbiddenException('غير مصرح');

    return this.prisma.busListingStatusLog.findMany({
      where: { busListingId: listingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(listingId: string, userId: string) {
    const listing = await this.prisma.busListing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('إعلان الحافلة غير موجود');
    if (listing.userId !== userId) throw new ForbiddenException('غير مصرح');

    const [statusHistory, offersCount] = await Promise.all([
      this.prisma.busListingStatusLog.findMany({
        where: { busListingId: listingId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.busListingOffer.count({
        where: { requestListingId: listingId },
      }),
    ]);

    return {
      viewCount: listing.viewCount,
      status: listing.status,
      createdAt: listing.createdAt,
      statusHistory,
      offersCount,
    };
  }
}
