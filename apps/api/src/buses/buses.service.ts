import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LISTING_EVENTS, ListingEventPayload } from '../common/events/listing.events';
import { ListingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

import { CreateBusListingDto } from './dto/create-bus-listing.dto';
import { UpdateBusListingDto } from './dto/update-bus-listing.dto';
import { QueryBusListingsDto } from './dto/query-bus-listings.dto';
import { generateSlug, USER_SELECT } from '../common/utils/entity.utils';
import { USER_SELECT_LISTING_PUBLIC } from '../common/constants/user-select.constant';
import { assertEntityVisible } from '../listings/listing-visibility';
import { findSimilarListings } from '../common/utils/similar-listings.util';

const VIEW_COOLDOWN_SECONDS = 3600; // 1 view per IP per listing per hour
const LIST_CACHE_TTL = 300;   // 5 min
const DETAIL_CACHE_TTL = 600; // 10 min

/**
 * Fields only a signed-in viewer may see on a bus listing (visitors get them stripped).
 * Phone/WhatsApp are additionally always available through GET /contact/BUS_LISTING/:id.
 */
const MEMBERS_ONLY_FIELDS = [
  'contactPhone',
  'whatsapp',
  'contractClient',
  'contractMonthly',
  'contractDuration',
  'contractExpiry',
] as const;

/** Returns a shallow copy without the members-only fields. */
export function stripMembersOnlyFields<T extends Record<string, any>>(bus: T): T {
  const copy: Record<string, any> = { ...bus };
  for (const f of MEMBERS_ONLY_FIELDS) delete copy[f];
  return copy as T;
}

const ALLOWED_TRANSITIONS: Record<string, ListingStatus[]> = {
  DRAFT:     ['ACTIVE'],
  ACTIVE:    ['SOLD', 'RENTED', 'ARCHIVED', 'SUSPENDED'],
  ARCHIVED:  ['ACTIVE'],
  RENTED:    ['ACTIVE'],
  SOLD:      [],
  SUSPENDED: [],
};

import { GeoService } from '../locations/geo.service';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';

@Injectable()
export class BusesService {
  private readonly logger = new Logger(BusesService.name);

  constructor(
    private readonly geoService: GeoService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2,
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



  async create(dto: CreateBusListingDto, userId: string) {
    await this.geoService.validateLocationPair(dto.governorateId, dto.wilayaId);

    const slug = generateSlug(dto.title);

    const bus = await this.prisma.$transaction(async (tx) => {
      const createdBus = await tx.busListing.create({
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
          withDriver: dto.withDriver ?? false,
          governorateId: dto.governorateId,
          wilayaId: dto.wilayaId,
          latitude: dto.latitude,
          longitude: dto.longitude,
          contactPhone: dto.contactPhone,
          whatsapp: dto.whatsapp,
          whatsappEnabled: dto.whatsappEnabled ?? false,
          userId,
        },
        include: {
          user: { select: USER_SELECT },
          images: true,
          governorateRef: true,
          wilayaRef: true,
        },
      });

      await tx.outboxEvent.create({
        data: {
          entityType: ENTITY_TYPES.BUS_LISTING,
          entityId: createdBus.id,
          action: 'UPSERT',
        },
      });

      return createdBus;
    });

    if (dto.latitude && dto.longitude) {
      await this.geoService.syncLocation('bus_listings', bus.id, dto.latitude, dto.longitude);
    }

    await this.invalidateCache();


    this.emitListingEvent(LISTING_EVENTS.CREATED, bus);

    return bus;
  }


  private cacheKey(suffix: string) { return `busListing:${suffix}`; }

  private async invalidateCache(id?: string) {
    await this.redis.delPattern('busListing:list:*');
    await this.redis.delPattern('busListing:similar:*');
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
    const andConditions: Prisma.BusListingWhereInput[] = [];

    if (query.search) {
      andConditions.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { make: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }
    if (query.busListingType) where.busListingType = query.busListingType;
    if (query.busType) where.busType = query.busType;
    if (query.make) where.make = { contains: query.make, mode: 'insensitive' };
    if (query.governorateId) where.governorateId = parseInt(query.governorateId);
    if (query.wilayaId) where.wilayaId = parseInt(query.wilayaId);
    if (query.userId) where.userId = query.userId;
    if (query.isPremium !== undefined) {
      where.isPremium = query.isPremium === 'true' || query.isPremium === (true as any);
    }

    const minPrice = query.minPrice || query.priceMin;
    const maxPrice = query.maxPrice || query.priceMax;
    if (minPrice || maxPrice) {
      const minDec = minPrice ? new Prisma.Decimal(minPrice) : undefined;
      const maxDec = maxPrice ? new Prisma.Decimal(maxPrice) : undefined;
      const priceRange: Prisma.DecimalFilter = {};
      if (minDec) priceRange.gte = minDec;
      if (maxDec) priceRange.lte = maxDec;

      andConditions.push({
        OR: [
          { price: priceRange },
          { dailyPrice: priceRange },
          { monthlyPrice: priceRange },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const minCapacity = query.minCapacity || query.capacityMin;
    const maxCapacity = query.maxCapacity || query.capacityMax;
    if (minCapacity || maxCapacity) {
      where.capacity = {};
      if (minCapacity) where.capacity.gte = parseInt(minCapacity);
      if (maxCapacity) where.capacity.lte = parseInt(maxCapacity);
    }

    if (query.condition) where.condition = query.condition as any;
    if (query.transmission) where.transmission = query.transmission as any;
    if (query.fuelType) {
      const fuels = query.fuelType.split(',').filter(Boolean);
      if (fuels.length === 1) {
        where.fuelType = fuels[0] as any;
      } else if (fuels.length > 1) {
        where.fuelType = { in: fuels as any[] };
      }
    }

    if (query.yearMin || query.yearMax) {
      where.year = {};
      if (query.yearMin) where.year.gte = parseInt(query.yearMin);
      if (query.yearMax) where.year.lte = parseInt(query.yearMax);
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
          user: { select: USER_SELECT_LISTING_PUBLIC },
          images: { orderBy: { order: 'asc' } },
          governorateRef: true,
          wilayaRef: true,
        },
      }),
      this.prisma.busListing.count({ where }),
    ]);

    // List cards never need contact/contract data — strip for everyone (cache is shared)
    const result = { items: items.map((b) => stripMembersOnlyFields(b)), meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    await this.redis.set(cKey, result, LIST_CACHE_TTL);
    return result;
  }

  /** Applies the visibility gate + viewer-dependent field stripping, then counts the view. */
  private async serveDetail(bus: any, ip?: string, viewerId?: string) {
    if (!bus || bus.deletedAt) throw new NotFoundException('إعلان الحافلة غير موجود');
    assertEntityVisible(bus, bus.userId, viewerId, 'إعلان الحافلة غير موجود');
    await this.incrementViewIfAllowed(bus.id, ip);
    return viewerId ? bus : stripMembersOnlyFields(bus);
  }

  async findOne(id: string, ip?: string, viewerId?: string) {
    const cKey = this.cacheKey(`detail:${id}`);
    let bus = await this.redis.get<any>(cKey);

    if (!bus) {
      bus = await this.prisma.busListing.findFirst({
        where: { id, deletedAt: null },
        include: {
          user: { select: USER_SELECT_LISTING_PUBLIC },
          images: { orderBy: { order: 'asc' } },
          governorateRef: true,
          wilayaRef: true,
        },
      });
      if (!bus) throw new NotFoundException('إعلان الحافلة غير موجود');
      // The cache holds the full record; the gate and field stripping run on every read.
      await this.redis.set(cKey, bus, DETAIL_CACHE_TTL);
    }

    return this.serveDetail(bus, ip, viewerId);
  }

  async findBySlug(slug: string, ip?: string, viewerId?: string) {
    const cKey = this.cacheKey(`slug:${slug}`);
    let bus = await this.redis.get<any>(cKey);

    if (!bus) {
      bus = await this.prisma.busListing.findFirst({
        where: { slug, deletedAt: null },
        include: {
          user: { select: USER_SELECT_LISTING_PUBLIC },
          images: { orderBy: { order: 'asc' } },
          governorateRef: true,
          wilayaRef: true,
        },
      });
      if (!bus) throw new NotFoundException('إعلان الحافلة غير موجود');
      await this.redis.set(cKey, bus, DETAIL_CACHE_TTL);
    }

    return this.serveDetail(bus, ip, viewerId);
  }

  async findSimilar(id: string, limit = 8, viewerId?: string) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit) || 8, 1), 20);

    // Gate first: a hidden listing must not leak through its "similar" list (or its cache).
    const original = await this.prisma.busListing.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true, status: true, userId: true,
        busListingType: true, busType: true, make: true, year: true,
        price: true, dailyPrice: true,
      },
    });
    if (!original) throw new NotFoundException('إعلان الحافلة غير موجود');
    assertEntityVisible(original, original.userId, viewerId, 'إعلان الحافلة غير موجود');

    const cKey = this.cacheKey(`similar:${id}:${safeLimit}`);
    const cached = await this.redis.get<any[]>(cKey);
    if (cached) return cached;

    const isRent = original.busListingType === 'BUS_RENT';
    const priceField = isRent ? 'dailyPrice' : 'price';
    const reference = isRent ? original.dailyPrice : original.price;
    const refNum = reference == null ? 0 : Number(reference);
    const priceWindow =
      refNum > 0
        ? { [priceField]: { gte: new Prisma.Decimal(refNum * 0.7), lte: new Prisma.Decimal(refNum * 1.3) } }
        : {};

    const items = await findSimilarListings({
      delegate: this.prisma.busListing,
      excludeId: id,
      limit: safeLimit,
      baseWhere: {
        status: 'ACTIVE',
        deletedAt: null,
        busListingType: original.busListingType,
        busType: original.busType,
      },
      narrowWhere: {
        make: { equals: original.make, mode: 'insensitive' },
        year: { gte: original.year - 3, lte: original.year + 3 },
        ...priceWindow,
      },
      broaderWhere: { make: { equals: original.make, mode: 'insensitive' } },
      referencePrice: reference,
      priceOf: (row) => (isRent ? row.dailyPrice : row.price),
      query: {
        include: {
          user: { select: USER_SELECT_LISTING_PUBLIC },
          images: { orderBy: { order: 'asc' }, take: 1 },
          governorateRef: true,
          wilayaRef: true,
        },
      },
    });

    // Card data only: never expose contact/contract fields in a list
    const result = items.map((b) => stripMembersOnlyFields(b));
    await this.redis.set(cKey, result, LIST_CACHE_TTL);
    return result;
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
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          governorateRef: true,
          wilayaRef: true,
        },
      }),
      this.prisma.busListing.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async update(id: string, userId: string, dto: UpdateBusListingDto) {
    const bus = await this.prisma.busListing.findUnique({ where: { id } });
    if (!bus) throw new NotFoundException('إعلان الحافلة غير موجود');
    if (bus.userId !== userId) throw new ForbiddenException('غير مصرح لك بتعديل هذا الإعلان');

    const nextGovId = dto.governorateId !== undefined ? dto.governorateId : bus.governorateId;
    const nextWilayaId = dto.wilayaId !== undefined ? dto.wilayaId : bus.wilayaId;
    if (nextGovId || nextWilayaId) {
      await this.geoService.validateLocationPair(nextGovId ?? undefined, nextWilayaId ?? undefined);
    }

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

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.busListing.update({
        where: { id },
        data,
        include: {
          user: { select: USER_SELECT },
          images: { orderBy: { order: 'asc' } },
          governorateRef: true,
          wilayaRef: true,
        },
      });

      await tx.outboxEvent.create({
        data: {
          entityType: ENTITY_TYPES.BUS_LISTING,
          entityId: res.id,
          action: 'UPSERT',
        },
      });

      return res;
    });

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      if (dto.latitude && dto.longitude) {
        await this.geoService.syncLocation('bus_listings', updated.id, dto.latitude, dto.longitude);
      } else if (dto.latitude === null || dto.longitude === null) {
        await this.geoService.clearLocation('bus_listings', updated.id);
      }
    }

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


    this.emitListingEvent(LISTING_EVENTS.UPDATED, updated);
    if (statusChanged) {
      this.emitListingEvent(LISTING_EVENTS.STATUS_CHANGED, updated, updated.status);
    }

    return updated;
  }

  async remove(id: string, userId: string) {
    const bus = await this.prisma.busListing.findUnique({ where: { id } });
    if (!bus) throw new NotFoundException('إعلان الحافلة غير موجود');
    if (bus.userId !== userId) throw new ForbiddenException('غير مصرح لك بحذف هذا الإعلان');

    await this.prisma.$transaction(async (tx) => {
      await tx.busListing.update({ where: { id }, data: { deletedAt: new Date() } });
      await tx.outboxEvent.create({
        data: {
          entityType: ENTITY_TYPES.BUS_LISTING,
          entityId: id,
          action: 'DELETE',
        },
      });
    });
    await this.invalidateCache(id);


    // Clean up orphaned conversations & favorites
    await this.prisma.cleanupPolymorphicOrphans('BUS_LISTING', id);

    this.emitListingEvent(LISTING_EVENTS.DELETED, bus);

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

    const statusHistory = await this.prisma.busListingStatusLog.findMany({
      where: { busListingId: listingId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      viewCount: listing.viewCount,
      status: listing.status,
      createdAt: listing.createdAt,
      statusHistory,
    };
  }

  private emitListingEvent(event: string, item: any, status?: string) {
    try {
      const payload: ListingEventPayload = {
        entityType: ENTITY_TYPES.BUS_LISTING,
        listingId: item.id,
        title: item.title,
        userId: item.userId,
        status,
      };
      this.eventEmitter.emit(event, payload);
    } catch (err) {
      this.logger.error(`Failed to emit ${event}`, err);
    }
  }
}
