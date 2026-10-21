import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LISTING_EVENTS, ListingEventPayload } from '../common/events/listing.events';
import { Prisma, EquipmentType, EquipmentListingType, ItemCondition, ListingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentListingDto } from './dto/create-equipment-listing.dto';
import { UpdateEquipmentListingDto } from './dto/update-equipment-listing.dto';
import { QueryEquipmentListingsDto } from './dto/query-equipment-listings.dto';
import { USER_SELECT, MAX_IMAGES_PER_LISTING, generateSlug } from './equipment.utils';

import { GeoService } from '../locations/geo.service';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';
import { ActiveListingsLimitService } from '../common/services/active-listings-limit.service';
import { stripDeprecatedContactFields } from '../common/utils/contact.utils';
import { assertPublicOrOwner, VisibilityViewer } from '../common/public-visibility';
import { findSimilarListings } from '../common/utils/similar-listings.util';
import { EquipmentViewCounterService } from './equipment-view-counter.service';

const ALLOWED_TRANSITIONS: Record<string, ListingStatus[]> = {
  DRAFT:     ['ACTIVE'],
  ACTIVE:    ['SOLD', 'RENTED', 'ARCHIVED', 'SUSPENDED'],
  ARCHIVED:  ['ACTIVE'],
  RENTED:    ['ACTIVE'],
  SOLD:      [],
  SUSPENDED: [],
};

@Injectable()
export class EquipmentListingsService {
  private readonly logger = new Logger(EquipmentListingsService.name);

  constructor(
    private readonly geoService: GeoService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly sellerContactGate: SellerContactGate,
    private readonly activeListingsLimitService: ActiveListingsLimitService,
    private readonly viewCounterService: EquipmentViewCounterService,
  ) {}

  async create(dto: CreateEquipmentListingDto, userId: string) {
    await this.sellerContactGate.assertCanPublish(userId);
    const cleanDto = stripDeprecatedContactFields(dto);
    if (cleanDto.listingType === 'EQUIPMENT_WANTED') {
      cleanDto.price = undefined;
      cleanDto.dailyPrice = undefined;
      cleanDto.monthlyPrice = undefined;
      cleanDto.make = undefined;
      cleanDto.model = undefined;
      cleanDto.year = undefined;
      cleanDto.condition = undefined;
    } else if (cleanDto.listingType === 'EQUIPMENT_SALE') {
      cleanDto.dailyPrice = undefined;
      cleanDto.monthlyPrice = undefined;
      cleanDto.budgetMin = undefined;
      cleanDto.budgetMax = undefined;
      cleanDto.quantity = undefined;
    } else if (cleanDto.listingType === 'EQUIPMENT_RENT') {
      cleanDto.price = undefined;
      cleanDto.budgetMin = undefined;
      cleanDto.budgetMax = undefined;
      cleanDto.quantity = undefined;
    }
    
    await this.geoService.validateLocationPair(cleanDto.governorateId, cleanDto.wilayaId);

    const item = await this.prisma.$transaction(async (tx) => {
      await this.activeListingsLimitService.assertWithinLimit(userId, tx);
      const createdItem = await tx.equipmentListing.create({
        data: {
          title: cleanDto.title,
          slug: generateSlug(cleanDto.title),
          description: cleanDto.description,
          equipmentType: cleanDto.equipmentType as EquipmentType,
          listingType: cleanDto.listingType as EquipmentListingType,
          make: cleanDto.make,
          model: cleanDto.model,
          year: cleanDto.year,
          condition: (cleanDto.condition as ItemCondition) ?? 'USED',
          capacity: cleanDto.capacity,
          power: cleanDto.power,
          weight: cleanDto.weight,
          hoursUsed: cleanDto.hoursUsed,
          features: cleanDto.features ?? [],
          price: cleanDto.price != null ? new Prisma.Decimal(cleanDto.price) : null,
          dailyPrice: cleanDto.dailyPrice != null ? new Prisma.Decimal(cleanDto.dailyPrice) : null,
          monthlyPrice: cleanDto.monthlyPrice != null ? new Prisma.Decimal(cleanDto.monthlyPrice) : null,
          currency: cleanDto.currency ?? 'OMR',
          isPriceNegotiable: cleanDto.isPriceNegotiable ?? false,
          withOperator: cleanDto.withOperator ?? false,
          deliveryAvailable: cleanDto.deliveryAvailable ?? false,
          budgetMin: cleanDto.budgetMin != null ? new Prisma.Decimal(cleanDto.budgetMin) : null,
          budgetMax: cleanDto.budgetMax != null ? new Prisma.Decimal(cleanDto.budgetMax) : null,
          rentalDuration: cleanDto.rentalDuration,
          startDate: cleanDto.startDate ? new Date(cleanDto.startDate) : null,
          endDate: cleanDto.endDate ? new Date(cleanDto.endDate) : null,
          quantity: cleanDto.quantity,
          siteDetails: cleanDto.siteDetails,
          governorateId: cleanDto.governorateId,
          wilayaId: cleanDto.wilayaId,
          latitude: cleanDto.latitude,
          longitude: cleanDto.longitude,
          whatsappEnabled: cleanDto.whatsappEnabled ?? false,
          userId,
          ...(cleanDto.images && cleanDto.images.length > 0 && {
            images: {
              create: cleanDto.images.map((url, i) => ({
                url,
                order: i,
                isPrimary: i === 0,
              })),
            },
          }),
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
          entityType: ENTITY_TYPES.EQUIPMENT_LISTING,
          entityId: createdItem.id,
          action: 'UPSERT',
        },
      });

      return createdItem;
    });

    if (dto.latitude && dto.longitude) {
      await this.geoService.syncLocation('equipment_listings', item.id, dto.latitude, dto.longitude);
    }

    this.emitListingEvent(LISTING_EVENTS.CREATED, item);
    return item;
  }

  async findAll(q: QueryEquipmentListingsDto) {
    const page = q.page ?? 1;
    const limit = Math.min(q.limit ?? 20, 50);
    const where: Prisma.EquipmentListingWhereInput = { status: 'ACTIVE', deletedAt: null, hiddenByOwnerStatus: false };

    // ─── Existing filters ────────────────────────────────────────────────────
    if (q.equipmentType) where.equipmentType = q.equipmentType as EquipmentType;
    if (q.listingType) where.listingType = q.listingType as EquipmentListingType;
    if (q.governorateId) where.governorateId = q.governorateId;
    if (q.wilayaId) where.wilayaId = q.wilayaId;
    if (q.userId) where.userId = q.userId;
    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: 'insensitive' } },
        { description: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    // TODO: migrate to GIN index or Meilisearch for 50K+ records

    // ─── Rich filters ────────────────────────────────────────────────────────
    if (q.condition) where.condition = q.condition as ItemCondition;

    // make / model: case-insensitive exact match
    if (q.make) where.make = { equals: q.make, mode: 'insensitive' };
    if (q.model) where.model = { equals: q.model, mode: 'insensitive' };

    // year range
    if (q.yearMin != null || q.yearMax != null) {
      where.year = {
        ...(q.yearMin != null && { gte: q.yearMin }),
        ...(q.yearMax != null && { lte: q.yearMax }),
      };
    }

    // hoursUsed upper bound
    if (q.hoursUsedMax != null) where.hoursUsed = { lte: q.hoursUsedMax };

    // price range — sale listings use `price`, rent listings use `dailyPrice`
    if (q.minPrice != null || q.maxPrice != null) {
      const priceFilter: Prisma.DecimalNullableFilter = {
        ...(q.minPrice != null && { gte: new Prisma.Decimal(q.minPrice) }),
        ...(q.maxPrice != null && { lte: new Prisma.Decimal(q.maxPrice) }),
      };
      if (q.listingType === 'EQUIPMENT_RENT') {
        where.dailyPrice = priceFilter;
      } else {
        // Applies to EQUIPMENT_SALE or unspecified listingType
        where.price = priceFilter;
      }
    }

    let orderBy: Prisma.EquipmentListingOrderByWithRelationInput = { createdAt: 'desc' };
    if (q.sortBy === 'price_asc') {
      orderBy = q.listingType === 'EQUIPMENT_RENT' ? { dailyPrice: 'asc' } : { price: 'asc' };
    } else if (q.sortBy === 'price_desc') {
      orderBy = q.listingType === 'EQUIPMENT_RENT' ? { dailyPrice: 'desc' } : { price: 'desc' };
    } else if (q.sortBy === 'year_desc') {
      orderBy = { year: 'desc' };
    } else if (q.sortBy === 'views_desc') {
      orderBy = { viewCount: 'desc' };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.equipmentListing.findMany({
        where, orderBy, skip: (page - 1) * limit, take: limit,
        include: {
          user: { select: USER_SELECT },
          images: { orderBy: { order: 'asc' }, take: 1 },
          governorateRef: true,
          wilayaRef: true,
        },
      }),
      this.prisma.equipmentListing.count({ where }),
    ]);
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, ip?: string, viewer?: VisibilityViewer | string | null) {
    const item = await this.prisma.equipmentListing.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
        images: { orderBy: { order: 'asc' } },
        governorateRef: true,
        wilayaRef: true,
      },
    });
    if (!item || item.deletedAt) throw new NotFoundException('الإعلان غير موجود');
    assertPublicOrOwner('equipmentListing', item, item.userId, viewer, 'الإعلان غير موجود');

    const viewerId = typeof viewer === 'string' ? viewer : viewer?.sub;
    this.viewCounterService.recordView({
      listingId: item.id,
      ownerId: item.userId,
      status: item.status,
      hiddenByOwnerStatus: item.hiddenByOwnerStatus,
      deletedAt: item.deletedAt,
      viewerId,
      viewerIp: ip,
    }).catch(() => {});

    return item;
  }

  async findBySlug(slug: string, ip?: string, viewer?: VisibilityViewer | string | null) {
    const item = await this.prisma.equipmentListing.findUnique({
      where: { slug },
      include: {
        user: { select: USER_SELECT },
        images: { orderBy: { order: 'asc' } },
        governorateRef: true,
        wilayaRef: true,
      },
    });
    if (!item || item.deletedAt) throw new NotFoundException('الإعلان غير موجود');
    assertPublicOrOwner('equipmentListing', item, item.userId, viewer, 'الإعلان غير موجود');

    const viewerId = typeof viewer === 'string' ? viewer : viewer?.sub;
    this.viewCounterService.recordView({
      listingId: item.id,
      ownerId: item.userId,
      status: item.status,
      hiddenByOwnerStatus: item.hiddenByOwnerStatus,
      deletedAt: item.deletedAt,
      viewerId,
      viewerIp: ip,
    }).catch(() => {});

    return item;
  }

  async findSimilar(id: string, limit = 8, viewer?: VisibilityViewer | string | null) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit) || 8, 1), 20);

    const original = await this.prisma.equipmentListing.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        status: true,
        userId: true,
        hiddenByOwnerStatus: true,
        deletedAt: true,
        equipmentType: true,
        listingType: true,
        make: true,
        year: true,
        price: true,
        dailyPrice: true,
      },
    });

    if (!original) throw new NotFoundException('الإعلان غير موجود');
    assertPublicOrOwner('equipmentListing', original, original.userId, viewer, 'الإعلان غير موجود');

    const isWanted = original.listingType === 'EQUIPMENT_WANTED';
    const isRent = original.listingType === 'EQUIPMENT_RENT';
    const priceField = isRent ? 'dailyPrice' : 'price';
    const reference = isRent ? original.dailyPrice : original.price;
    const refNum = reference == null ? 0 : Number(reference);

    const priceWindow =
      !isWanted && refNum > 0
        ? { [priceField]: { gte: new Prisma.Decimal(refNum * 0.7), lte: new Prisma.Decimal(refNum * 1.3) } }
        : {};

    const narrowWhere: Record<string, any> = {};
    const broaderWhere: Record<string, any> = {};

    if (isWanted) {
      // WANTED listings: same equipmentType only, NO price ranking, NO make/year ranking
    } else {
      if (original.make) {
        narrowWhere.make = { equals: original.make, mode: 'insensitive' };
        broaderWhere.make = { equals: original.make, mode: 'insensitive' };
      }
      if (original.year != null) {
        narrowWhere.year = { gte: original.year - 3, lte: original.year + 3 };
      }
      Object.assign(narrowWhere, priceWindow);
    }

    const items = await findSimilarListings({
      delegate: this.prisma.equipmentListing,
      excludeId: id,
      limit: safeLimit,
      baseWhere: {
        status: 'ACTIVE',
        deletedAt: null,
        hiddenByOwnerStatus: false,
        equipmentType: original.equipmentType,
        listingType: original.listingType,
      },
      narrowWhere,
      broaderWhere: Object.keys(broaderWhere).length > 0 ? broaderWhere : undefined,
      referencePrice: isWanted ? null : reference,
      priceOf: (row) => (isRent ? row.dailyPrice : row.price),
      query: {
        include: {
          user: { select: USER_SELECT },
          images: { orderBy: { order: 'asc' }, take: 1 },
          governorateRef: true,
          wilayaRef: true,
        },
      },
    });

    return items;
  }

  async my(userId: string, page = 1, limit = 20) {
    limit = Math.min(limit, 50);
    const skip = (page - 1) * limit;
    const where: Prisma.EquipmentListingWhereInput = { userId, deletedAt: null };

    const [items, total] = await Promise.all([
      this.prisma.equipmentListing.findMany({
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
      this.prisma.equipmentListing.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async update(id: string, userId: string, dto: UpdateEquipmentListingDto) {
    const item = await this.prisma.equipmentListing.findUnique({ where: { id } });
    if (!item || item.deletedAt) throw new NotFoundException('الإعلان غير موجود');
    if (item.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    // Fail fast on a stale client; the version-guarded UPDATE below still protects against races.
    if (dto.version != null && dto.version !== item.version) {
      throw new ConflictException('تم تعديل الإعلان من قبل مستخدم آخر أو أن النسخة غير متطابقة.');
    }

    const cleanDto = stripDeprecatedContactFields(dto);

    if (cleanDto.governorateId || cleanDto.wilayaId) {
      const targetGov = cleanDto.governorateId ?? item.governorateId;
      const targetWilaya = cleanDto.wilayaId ?? item.wilayaId;
      if (targetGov && targetWilaya) {
        await this.geoService.validateLocationPair(targetGov, targetWilaya);
      }
    }

    const effectiveListingType = dto.listingType ?? item.listingType;

    // Status state machine validation
    const statusChanged = Boolean(dto.status && dto.status !== item.status);
    if (statusChanged && dto.status) {
      const allowed = ALLOWED_TRANSITIONS[item.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `INVALID_STATUS_TRANSITION: ${item.status} → ${dto.status}`,
        );
      }

      if (effectiveListingType === 'EQUIPMENT_WANTED' && (dto.status === 'SOLD' || dto.status === 'RENTED')) {
        throw new BadRequestException(
          `INVALID_STATUS_TRANSITION: EQUIPMENT_WANTED listings may only transition between ACTIVE and ARCHIVED`,
        );
      }
      if (dto.status === 'SOLD' && effectiveListingType !== 'EQUIPMENT_SALE') {
        throw new BadRequestException(
          `INVALID_STATUS_TRANSITION: ${dto.status} is only allowed for EQUIPMENT_SALE`,
        );
      }
      if (dto.status === 'RENTED' && effectiveListingType !== 'EQUIPMENT_RENT') {
        throw new BadRequestException(
          `INVALID_STATUS_TRANSITION: ${dto.status} is only allowed for EQUIPMENT_RENT`,
        );
      }

      // Gate: re-activating a listing requires seller to have a profile phone
      if (dto.status === 'ACTIVE') {
        await this.sellerContactGate.assertCanPublish(userId);
      }
    }

    const data: Record<string, unknown> = {};
    
    if (effectiveListingType === 'EQUIPMENT_WANTED') {
      dto.price = undefined; dto.dailyPrice = undefined; dto.monthlyPrice = undefined;
      dto.make = undefined; dto.model = undefined; dto.year = undefined; dto.condition = undefined;
      data.price = null; data.dailyPrice = null; data.monthlyPrice = null;
      data.make = null; data.model = null; data.year = null; data.condition = null;
    } else if (effectiveListingType === 'EQUIPMENT_SALE') {
      dto.dailyPrice = undefined; dto.monthlyPrice = undefined;
      dto.budgetMin = undefined; dto.budgetMax = undefined; dto.quantity = undefined;
      data.dailyPrice = null; data.monthlyPrice = null;
      data.budgetMin = null; data.budgetMax = null; data.quantity = null;
    } else if (effectiveListingType === 'EQUIPMENT_RENT') {
      dto.price = undefined; dto.budgetMin = undefined; dto.budgetMax = undefined; dto.quantity = undefined;
      data.price = null; data.budgetMin = null; data.budgetMax = null; data.quantity = null;
    }

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.equipmentType !== undefined) data.equipmentType = dto.equipmentType as EquipmentType;
    if (dto.listingType !== undefined) data.listingType = dto.listingType as EquipmentListingType;
    if (dto.make !== undefined) data.make = dto.make;
    if (dto.model !== undefined) data.model = dto.model;
    if (dto.year !== undefined) data.year = dto.year;
    if (dto.condition !== undefined) data.condition = dto.condition as ItemCondition;
    if (dto.capacity !== undefined) data.capacity = dto.capacity;
    if (dto.power !== undefined) data.power = dto.power;
    if (dto.weight !== undefined) data.weight = dto.weight;
    if (dto.hoursUsed !== undefined) data.hoursUsed = dto.hoursUsed;
    if (dto.features !== undefined) data.features = dto.features;
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);
    if (dto.dailyPrice !== undefined) data.dailyPrice = new Prisma.Decimal(dto.dailyPrice);
    if (dto.monthlyPrice !== undefined) data.monthlyPrice = new Prisma.Decimal(dto.monthlyPrice);
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.isPriceNegotiable !== undefined) data.isPriceNegotiable = dto.isPriceNegotiable;
    if (dto.withOperator !== undefined) data.withOperator = dto.withOperator;
    if (dto.deliveryAvailable !== undefined) data.deliveryAvailable = dto.deliveryAvailable;
    if (dto.budgetMin !== undefined) data.budgetMin = dto.budgetMin != null ? new Prisma.Decimal(dto.budgetMin) : null;
    if (dto.budgetMax !== undefined) data.budgetMax = dto.budgetMax != null ? new Prisma.Decimal(dto.budgetMax) : null;
    if (dto.rentalDuration !== undefined) data.rentalDuration = dto.rentalDuration;
    if (dto.startDate !== undefined) data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.quantity !== undefined) data.quantity = dto.quantity;
    if (dto.siteDetails !== undefined) data.siteDetails = dto.siteDetails;
    if (dto.governorateId !== undefined) data.governorateId = dto.governorateId;
    if (dto.wilayaId !== undefined) data.wilayaId = dto.wilayaId;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.whatsappEnabled !== undefined) data.whatsappEnabled = dto.whatsappEnabled;
    if (dto.status !== undefined) data.status = dto.status;

    // Optimistic concurrency: increment version on every update
    data.version = { increment: 1 };

    let updated;
    try {
      updated = await this.prisma.$transaction(async (tx) => {
        if (statusChanged && dto.status === 'ACTIVE') {
          await this.activeListingsLimitService.assertWithinLimit(userId, tx);
        }

        const guardVersion =
          dto.version != null ? dto.version : (dto.status !== undefined ? item.version : undefined);
        const whereClause: Prisma.EquipmentListingWhereUniqueInput =
          guardVersion != null ? { id, version: guardVersion } : { id };

        const res = await tx.equipmentListing.update({
          where: whereClause,
          data,
          include: {
            user: { select: USER_SELECT },
            images: { orderBy: { order: 'asc' } },
            governorateRef: true,
            wilayaRef: true,
          },
        });

        if (statusChanged) {
          await tx.equipmentListingStatusLog.create({
            data: {
              equipmentListingId: id,
              fromStatus: item.status,
              toStatus: dto.status!,
              changedBy: userId,
            },
          });
        }

        await tx.outboxEvent.create({
          data: {
            entityType: ENTITY_TYPES.EQUIPMENT_LISTING,
            entityId: res.id,
            action: 'UPSERT',
          },
        });

        return res;
      });
    } catch (e: any) {
      if (e?.code === 'P2025' || (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025')) {
        throw new ConflictException('تم تعديل الإعلان من قبل مستخدم آخر أو أن النسخة غير متطابقة.');
      }
      throw e;
    }

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      if (dto.latitude && dto.longitude) {
        await this.geoService.syncLocation('equipment_listings', updated.id, dto.latitude, dto.longitude);
      } else if (dto.latitude === null || dto.longitude === null) {
        await this.geoService.clearLocation('equipment_listings', updated.id);
      }
    }

    this.emitListingEvent(LISTING_EVENTS.UPDATED, updated);
    if (statusChanged) {
      this.emitListingEvent(LISTING_EVENTS.STATUS_CHANGED, updated, updated.status);
    }
    return updated;
  }

  async remove(id: string, userId: string) {
    const item = await this.prisma.equipmentListing.findUnique({ where: { id } });
    if (!item || item.deletedAt) throw new NotFoundException('الإعلان غير موجود');
    if (item.userId !== userId) throw new ForbiddenException('لا يمكنك حذف إعلان غيرك');
    await this.prisma.$transaction(async (tx) => {
      await tx.equipmentListing.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          version: { increment: 1 },
        },
      });
      await tx.outboxEvent.create({
        data: {
          entityType: ENTITY_TYPES.EQUIPMENT_LISTING,
          entityId: id,
          action: 'DELETE',
        },
      });
    });

    // Clean up orphaned conversations & favorites
    await this.prisma.cleanupPolymorphicOrphans('EQUIPMENT_LISTING', id);

    this.emitListingEvent(LISTING_EVENTS.DELETED, item);

    return { deleted: true };
  }

  async addImages(id: string, userId: string, urls: string[]) {
    const item = await this.prisma.equipmentListing.findUnique({ where: { id } });
    if (!item || item.deletedAt) throw new NotFoundException('الإعلان غير موجود');
    if (item.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    const count = await this.prisma.equipmentListingImage.count({ where: { equipmentListingId: id } });
    if (count + urls.length > MAX_IMAGES_PER_LISTING) {
      throw new BadRequestException(`الحد الأقصى ${MAX_IMAGES_PER_LISTING} صور لكل إعلان — لديك ${count} حالياً`);
    }

    const max = await this.prisma.equipmentListingImage.aggregate({ where: { equipmentListingId: id }, _max: { order: true } });
    let order = (max._max.order ?? -1) + 1;
    
    try {
      const queries = urls.map((url, i) =>
        this.prisma.equipmentListingImage.create({
          data: { url, order: order + i, isPrimary: count === 0 && i === 0, equipmentListingId: id },
        })
      );
      const images = await this.prisma.$transaction(queries);
      return images;
    } catch (error) {
      throw new InternalServerErrorException('فشل في حفظ الصور');
    }
  }

  async removeImage(imageId: string, userId: string) {
    const img = await this.prisma.equipmentListingImage.findUnique({
      where: { id: imageId },
      include: { equipmentListing: true },
    });
    if (!img || img.equipmentListing.deletedAt != null) throw new NotFoundException('الصورة غير موجودة');
    if (img.equipmentListing.userId !== userId) throw new ForbiddenException('لا يمكنك حذف صورة غيرك');
    
    await this.prisma.equipmentListingImage.delete({ where: { id: imageId } });

    if (img.isPrimary) {
      const nextImage = await this.prisma.equipmentListingImage.findFirst({
        where: { equipmentListingId: img.equipmentListingId },
        orderBy: { order: 'asc' },
      });
      if (nextImage) {
        await this.prisma.equipmentListingImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return { deleted: true };
  }

  // ════════════════════════════════════════════
  // Observability & Owner Stats
  // ════════════════════════════════════════════

  async getStatusHistory(listingId: string, userId: string) {
    const listing = await this.prisma.equipmentListing.findUnique({ where: { id: listingId } });
    if (!listing || listing.deletedAt) throw new NotFoundException('الإعلان غير موجود');
    if (listing.userId !== userId) throw new ForbiddenException('غير مصرح');

    return this.prisma.equipmentListingStatusLog.findMany({
      where: { equipmentListingId: listingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(listingId: string, userId: string) {
    const listing = await this.prisma.equipmentListing.findUnique({ where: { id: listingId } });
    if (!listing || listing.deletedAt) throw new NotFoundException('الإعلان غير موجود');
    if (listing.userId !== userId) throw new ForbiddenException('غير مصرح');

    const [favoritesCount, conversationsCount, statusHistory] = await Promise.all([
      this.prisma.favorite.count({
        where: {
          entityType: ENTITY_TYPES.EQUIPMENT_LISTING,
          entityId: listingId,
        },
      }),
      this.prisma.conversation.count({
        where: {
          entityType: ENTITY_TYPES.EQUIPMENT_LISTING,
          entityId: listingId,
        },
      }),
      this.prisma.equipmentListingStatusLog.findMany({
        where: { equipmentListingId: listingId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      viewCount: listing.viewCount,
      favoritesCount,
      conversationsCount,
      status: listing.status,
      createdAt: listing.createdAt,
      statusHistory,
    };
  }

  private emitListingEvent(event: string, item: any, status?: string) {
    try {
      const payload: ListingEventPayload = {
        entityType: ENTITY_TYPES.EQUIPMENT_LISTING,
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
