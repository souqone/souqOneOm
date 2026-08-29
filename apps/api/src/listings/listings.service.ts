import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LISTING_EVENTS, ListingEventPayload } from '../common/events/listing.events';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { GeoService } from '../locations/geo.service';
import { ListingsRepository } from './listings.repository';
import { CreateListingDto } from './dto/create-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';



@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly geoService: GeoService,
    private readonly repo: ListingsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
  }

  async getSuggestions(query: string) {
    const q = query.toLowerCase();
    
    // Simple fast query matching start of title, make, or model
    const listings = await this.prisma.listing.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { make: { contains: q, mode: 'insensitive' } },
          { model: { contains: q, mode: 'insensitive' } },
        ],
        status: 'ACTIVE',
      },
      select: {
        title: true,
        make: true,
        model: true,
      },
      take: 20,
    });

    // Extract unique words or phrases that match
    const suggestions = new Set<string>();
    for (const item of listings) {
      if (item.make && item.make.toLowerCase().includes(q)) suggestions.add(item.make);
      if (item.model && item.model.toLowerCase().includes(q)) suggestions.add(item.model);
      if (item.title && item.title.toLowerCase().includes(q)) {
        if (item.title.length < 30) suggestions.add(item.title);
      }
    }

    return Array.from(suggestions).slice(0, 5);
  }

  async create(dto: CreateListingDto, sellerId: string) {
    if (dto.images && dto.images.length > 20) {
      throw new BadRequestException('لا يمكن تجاوز 20 صورة');
    }

    // ── Duplicate Detection (Business Rule Judgment Call) ──
    // A 5-minute block on exact same title/description could legitimately hit a seller posting two similar parts.
    // To mitigate false positives, we also require exact match on price and brandId.
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicate = await this.prisma.listing.findFirst({
      where: {
        sellerId,
        title: dto.title,
        description: dto.description,
        price: dto.price ? new Prisma.Decimal(dto.price) : undefined,
        brandId: dto.brandId,
        createdAt: { gte: fiveMinutesAgo },
      },
    });

    if (duplicate) {
      throw new ConflictException('تم نشر إعلان مشابه جداً مؤخراً. يرجى الانتظار قليلاً.');
    }

    await this.geoService.validateLocationPair(dto.governorateId, dto.wilayaId);

    // Canonical Identity Validation
    const brand = await this.prisma.brand.findUnique({ where: { id: dto.brandId } });
    if (!brand) throw new BadRequestException('الماركة غير موجودة');
    
    const carModel = await this.prisma.carModel.findUnique({ where: { id: dto.carModelId } });
    if (!carModel) throw new BadRequestException('الموديل غير موجود');
    
    if (carModel.brandId !== dto.brandId) {
      throw new BadRequestException('الموديل لا يتبع للماركة المحددة');
    }

    let trimName: string | null = null;
    if (dto.carTrimId) {
      const carTrim = await this.prisma.carTrim.findUnique({ where: { id: dto.carTrimId } });
      if (!carTrim || carTrim.modelId !== dto.carModelId) {
        throw new BadRequestException('الفئة لا تتبع للموديل المحدد');
      }
      trimName = carTrim.name;
    }

    // Rental / Sale Validation
    if (dto.listingType === 'RENTAL') {
      if (!dto.dailyPrice || dto.dailyPrice <= 0) {
        throw new BadRequestException('سعر الإيجار اليومي مطلوب لإعلانات الإيجار');
      }
    } else {
      dto.dailyPrice = undefined;
      dto.monthlyPrice = undefined;
      dto.withDriver = undefined;
      dto.depositAmount = undefined;
      dto.minRentalDays = undefined;
      dto.kmLimitPerDay = undefined;
    }

    const slug = this.generateSlug(`${brand.name}-${carModel.name}-${dto.year}-${dto.title}`);

    const listing = await this.repo.create({
        title: dto.title,
        slug,
        description: dto.description,
        make: brand.name,
        model: carModel.name,
        trim: trimName,
        year: dto.year,
        price: new Prisma.Decimal(dto.price),
        mileage: dto.mileage,
        fuelType: dto.fuelType,
        transmission: dto.transmission,
        bodyType: dto.bodyType,
        exteriorColor: dto.exteriorColor,
        interior: dto.interior,
        engineSize: dto.engineSize,
        horsepower: dto.horsepower,
        doors: dto.doors,
        seats: dto.seats,
        driveType: dto.driveType,
        features: dto.features ?? [],
        currency: dto.currency ?? 'OMR',
        isPriceNegotiable: dto.isPriceNegotiable ?? false,
        condition: dto.condition ?? 'USED',
        listingType: dto.listingType ?? 'SALE',
        dailyPrice: dto.dailyPrice ? new Prisma.Decimal(dto.dailyPrice) : undefined,
        monthlyPrice: dto.monthlyPrice ? new Prisma.Decimal(dto.monthlyPrice) : undefined,
        withDriver: dto.withDriver ?? false,
        governorateRef: { connect: { id: dto.governorateId } },
        wilayaRef: { connect: { id: dto.wilayaId } },
        latitude: dto.latitude,
        longitude: dto.longitude,
        ...(dto.brandId    && { brand:    { connect: { id: dto.brandId    } } }),
        ...(dto.carModelId && { carModel: { connect: { id: dto.carModelId } } }),
        ...(dto.carTrimId  && { carTrim:  { connect: { id: dto.carTrimId  } } }),
        status: 'ACTIVE',
        seller: { connect: { id: sellerId } },
        ...(dto.images && dto.images.length > 0 && {
          images: {
            create: dto.images.map((url, i) => ({
              url,
              order: i,
              isPrimary: i === 0,
            })),
          },
        }),
    });

    if (listing.latitude && listing.longitude) {
      await this.geoService.syncLocation('listings', listing.id, listing.latitude, listing.longitude);
    }

    // Invalidate listings cache
    await this.redis.delPattern('listings:*');

    this.emitListingEvent(LISTING_EVENTS.CREATED, listing);

    return listing;
  }

  async findAll(query: QueryListingsDto) {
    // Generate cache key from query
    const cacheKey = `listings:${JSON.stringify(query)}`;
    
    // Try to get from cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { make: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.make) where.make = { equals: query.make, mode: 'insensitive' };
    if (query.model) where.model = { equals: query.model, mode: 'insensitive' };
    if (query.trim) where.trim = { equals: query.trim, mode: 'insensitive' };
    if (query.fuelType) {
      const fuels = query.fuelType.split(',').filter(Boolean);
      if (fuels.length === 1) {
        where.fuelType = fuels[0] as any;
      } else if (fuels.length > 1) {
        where.fuelType = { in: fuels as any[] };
      }
    }
    if (query.transmission) where.transmission = query.transmission;
    if (query.condition) where.condition = query.condition;
    if (query.bodyType) where.bodyType = query.bodyType;
    if (query.governorateId) where.governorateId = query.governorateId;
    if (query.wilayaId) where.wilayaId = query.wilayaId;
    if (query.sellerId) where.sellerId = query.sellerId;
    if (query.listingType) where.listingType = query.listingType;
    where.status = query.status ?? 'ACTIVE';

    if (query.yearMin || query.yearMax) {
      where.year = {};
      if (query.yearMin) where.year.gte = query.yearMin;
      if (query.yearMax) where.year.lte = query.yearMax;
    }

    if (query.priceMin || query.priceMax) {
      where.price = {};
      if (query.priceMin) where.price.gte = new Prisma.Decimal(query.priceMin);
      if (query.priceMax) where.price.lte = new Prisma.Decimal(query.priceMax);
    }

    if (query.mileageMin || query.mileageMax) {
      where.mileage = {};
      if (query.mileageMin) where.mileage.gte = query.mileageMin;
      if (query.mileageMax) where.mileage.lte = query.mileageMax;
    }

    const orderBy: Prisma.ListingOrderByWithRelationInput = {
      [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc',
    };

    const [items, total] = await this.repo.findMany(where, orderBy, skip, limit);

    const result = {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };

    // Cache for 5 minutes
    await this.redis.set(cacheKey, result, 300);

    return result;
  }

  async findMyListings(query: QueryListingsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {};
    if (query.sellerId) where.sellerId = query.sellerId;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { make: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ListingOrderByWithRelationInput = {
      [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc',
    };

    const [items, total] = await this.repo.findMany(where, orderBy, skip, limit);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const cacheKey = `listing:${id}`;
    
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const listing = await this.repo.findById(id);

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    await this.redis.set(cacheKey, listing, 600); // 10 minutes

    return listing;
  }

  async findBySlug(slug: string) {
    const listing = await this.repo.findBySlug(slug);

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    await this.repo.incrementViewCount(listing.id);

    return listing;
  }

  async update(id: string, dto: UpdateListingDto, userId: string) {
    const listing = await this.repo.findById(id);
    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');
    }

    if (listing.status === 'SUSPENDED' || listing.status === 'SOLD') {
      throw new ForbiddenException('لا يمكن تعديل إعلان موقوف أو مباع');
    }

    const nextGovId = dto.governorateId !== undefined ? dto.governorateId : listing.governorateId;
    const nextWilayaId = dto.wilayaId !== undefined ? dto.wilayaId : listing.wilayaId;
    if (nextGovId || nextWilayaId) {
      await this.geoService.validateLocationPair(nextGovId ?? undefined, nextWilayaId ?? undefined);
    }

    const data: Prisma.ListingUpdateInput = {};

    // Merged state validation
    const hasRentalFieldChange =
      dto.listingType !== undefined ||
      dto.dailyPrice !== undefined ||
      dto.monthlyPrice !== undefined ||
      dto.withDriver !== undefined ||
      dto.depositAmount !== undefined ||
      dto.minRentalDays !== undefined ||
      dto.kmLimitPerDay !== undefined;

    if (hasRentalFieldChange) {
      const effectiveListingType = dto.listingType !== undefined ? dto.listingType : listing.listingType;
      const effectiveDailyPrice = dto.dailyPrice !== undefined ? dto.dailyPrice : Number(listing.dailyPrice);

      if (effectiveListingType === 'RENTAL') {
        if (!effectiveDailyPrice || effectiveDailyPrice <= 0) {
          throw new BadRequestException('سعر الإيجار اليومي مطلوب لإعلانات الإيجار');
        }
      } else {
        data.dailyPrice = null;
        data.monthlyPrice = null;
        data.withDriver = false;
        data.depositAmount = null;
        data.minRentalDays = null;
        data.kmLimitPerDay = null;
      }
    }

    // Canonical Identity Update
    if (dto.brandId || dto.carModelId || dto.carTrimId !== undefined) {
      const targetBrandId = dto.brandId ?? listing.brandId;
      const targetModelId = dto.carModelId ?? listing.carModelId;
      const targetTrimId = dto.carTrimId !== undefined ? dto.carTrimId : listing.carTrimId;
      
      if (!targetBrandId || !targetModelId) {
        throw new BadRequestException('البيانات الأساسية للمركبة مفقودة');
      }
      
      const brand = await this.prisma.brand.findUnique({ where: { id: targetBrandId } });
      const carModel = await this.prisma.carModel.findUnique({ where: { id: targetModelId } });
      if (!brand || !carModel) throw new BadRequestException('الماركة أو الموديل غير موجود');
      if (carModel.brandId !== targetBrandId) throw new BadRequestException('الموديل لا يتبع للماركة');
      
      data.make = brand.name;
      data.model = carModel.name;
      
      if (targetTrimId) {
        const carTrim = await this.prisma.carTrim.findUnique({ where: { id: targetTrimId } });
        if (!carTrim || carTrim.modelId !== targetModelId) throw new BadRequestException('الفئة لا تتبع للموديل');
        data.trim = carTrim.name;
      } else {
        data.trim = null;
      }
    }

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.year !== undefined) data.year = dto.year;
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);
    if (dto.mileage !== undefined) data.mileage = dto.mileage;
    if (dto.fuelType !== undefined) data.fuelType = dto.fuelType;
    if (dto.transmission !== undefined) data.transmission = dto.transmission;
    if (dto.bodyType !== undefined) data.bodyType = dto.bodyType;
    if (dto.exteriorColor !== undefined) data.exteriorColor = dto.exteriorColor;
    if (dto.interior !== undefined) data.interior = dto.interior;
    if (dto.engineSize !== undefined) data.engineSize = dto.engineSize;
    if (dto.horsepower !== undefined) data.horsepower = dto.horsepower;
    if (dto.doors !== undefined) data.doors = dto.doors;
    if (dto.seats !== undefined) data.seats = dto.seats;
    if (dto.driveType !== undefined) data.driveType = dto.driveType;
    if (dto.features !== undefined) data.features = dto.features;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.isPriceNegotiable !== undefined) data.isPriceNegotiable = dto.isPriceNegotiable;
    if (dto.condition !== undefined) data.condition = dto.condition;
    if (dto.governorateId !== undefined) {
      if (dto.governorateId) data.governorateRef = { connect: { id: dto.governorateId } };
      else data.governorateRef = { disconnect: true };
    }
    if (dto.wilayaId !== undefined) {
      if (dto.wilayaId) data.wilayaRef = { connect: { id: dto.wilayaId } };
      else data.wilayaRef = { disconnect: true };
    }
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.listingType !== undefined) data.listingType = dto.listingType;
    if (dto.dailyPrice !== undefined) data.dailyPrice = dto.dailyPrice ? new Prisma.Decimal(dto.dailyPrice) : null;
    if (dto.monthlyPrice !== undefined) data.monthlyPrice = dto.monthlyPrice ? new Prisma.Decimal(dto.monthlyPrice) : null;
    if (dto.withDriver !== undefined) data.withDriver = dto.withDriver;
    if (dto.depositAmount !== undefined) data.depositAmount = dto.depositAmount ? new Prisma.Decimal(dto.depositAmount) : null;
    if (dto.minRentalDays !== undefined) data.minRentalDays = dto.minRentalDays;
    if (dto.kmLimitPerDay !== undefined) data.kmLimitPerDay = dto.kmLimitPerDay;
    if (dto.cancellationPolicy !== undefined) data.cancellationPolicy = dto.cancellationPolicy;
    if (dto.deliveryAvailable !== undefined) data.deliveryAvailable = dto.deliveryAvailable;
    if (dto.insuranceIncluded !== undefined) data.insuranceIncluded = dto.insuranceIncluded;
    if (dto.brandId !== undefined)    data.brand    = dto.brandId    ? { connect: { id: dto.brandId    } } : { disconnect: true };
    if (dto.carModelId !== undefined) data.carModel = dto.carModelId ? { connect: { id: dto.carModelId } } : { disconnect: true };
    if (dto.carTrimId !== undefined)  data.carTrim  = dto.carTrimId  ? { connect: { id: dto.carTrimId  } } : { disconnect: true };

    let updated;
    try {
      updated = await this.repo.update(id, data, dto.version);
    } catch (e: any) {
      if (e?.code === 'P2025' || (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025')) {
        throw new ConflictException('تم تعديل الإعلان من قبل مستخدم آخر أو أن النسخة غير متطابقة.');
      }
      throw e;
    }

    if (updated.latitude && updated.longitude) {
      await this.geoService.syncLocation('listings', updated.id, updated.latitude, updated.longitude);
    } else if (dto.latitude === null || dto.longitude === null) {
      await this.geoService.clearLocation('listings', updated.id);
    }

    // Invalidate cache
    await this.redis.delPattern('listings:*');
    await this.redis.del(`listing:${id}`);

    this.emitListingEvent(LISTING_EVENTS.UPDATED, updated);

    return updated;
  }

  // ─── Status Commands & Transitions ───

  private canTransition(currentStatus: string, targetStatus: string, actorRole: 'OWNER' | 'ADMIN'): boolean {
    if (actorRole === 'ADMIN') return true;

    if (currentStatus === 'SUSPENDED') return false; // Only admin can lift suspension

    const validTransitions: Record<string, string[]> = {
      'DRAFT': ['PENDING_REVIEW', 'ACTIVE'], // Depends on moderation policy
      'ACTIVE': ['SOLD', 'ARCHIVED'],
      'PENDING_REVIEW': [],
      'ARCHIVED': ['ACTIVE'], // Restore
      'SOLD': [], // Cannot unsell easily, or needs admin
    };

    return validTransitions[currentStatus]?.includes(targetStatus) ?? false;
  }

  private async executeStatusTransition(id: string, userId: string, targetStatus: any, expectedVersion: number) {
    const listing = await this.repo.findById(id);
    if (!listing) throw new NotFoundException('الإعلان غير موجود');
    if (listing.sellerId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    if (!this.canTransition(listing.status, targetStatus, 'OWNER')) {
      throw new ForbiddenException(`لا يمكنك تغيير حالة الإعلان من ${listing.status} إلى ${targetStatus}`);
    }

    let updated;
    try {
      updated = await this.repo.update(id, { status: targetStatus }, expectedVersion);
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new ConflictException('تم تعديل الإعلان من قبل مستخدم آخر أو أن النسخة غير متطابقة.');
      }
      throw e;
    }
    
    // Invalidate cache
    await this.redis.delPattern('listings:*');
    await this.redis.del(`listing:${id}`);
    
    this.emitListingEvent(LISTING_EVENTS.STATUS_CHANGED, updated, updated.status);
    return updated;
  }

  async submitListing(id: string, userId: string, expectedVersion: number) {
    return this.executeStatusTransition(id, userId, 'ACTIVE', expectedVersion); // Or PENDING_REVIEW based on policy
  }

  async markListingSold(id: string, userId: string, expectedVersion: number) {
    return this.executeStatusTransition(id, userId, 'SOLD', expectedVersion);
  }

  async archiveListing(id: string, userId: string, expectedVersion: number) {
    return this.executeStatusTransition(id, userId, 'ARCHIVED', expectedVersion);
  }

  async restoreListing(id: string, userId: string, expectedVersion: number) {
    return this.executeStatusTransition(id, userId, 'ACTIVE', expectedVersion);
  }

  async remove(id: string, userId: string) {
    const listing = await this.repo.findById(id);
    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('لا يمكنك حذف إعلان غيرك');
    }

    await this.repo.delete(id);

    // Clean up orphaned conversations & favorites
    await this.prisma.cleanupPolymorphicOrphans('LISTING', id);

    // Invalidate cache
    await this.redis.delPattern('listings:*');
    await this.redis.del(`listing:${id}`);

    this.emitListingEvent(LISTING_EVENTS.DELETED, listing);

    return { message: 'تم حذف الإعلان بنجاح' };
  }

  private emitListingEvent(event: string, item: any, status?: string) {
    try {
      const payload: ListingEventPayload = {
        entityType: ENTITY_TYPES.LISTING,
        listingId: item.id,
        title: item.title,
        userId: item.sellerId,
        status,
      };
      this.eventEmitter.emit(event, payload);
    } catch (err) {
      this.logger.error(`Failed to emit ${event}`, err);
    }
  }
}
