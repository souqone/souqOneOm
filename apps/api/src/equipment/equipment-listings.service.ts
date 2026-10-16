import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LISTING_EVENTS, ListingEventPayload } from '../common/events/listing.events';
import { Prisma, EquipmentType, EquipmentListingType, ItemCondition } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentListingDto } from './dto/create-equipment-listing.dto';
import { UpdateEquipmentListingDto } from './dto/update-equipment-listing.dto';
import { QueryEquipmentListingsDto } from './dto/query-equipment-listings.dto';
import { USER_SELECT, MAX_IMAGES_PER_LISTING, generateSlug } from './equipment.utils';

import { GeoService } from '../locations/geo.service';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';
import { stripDeprecatedContactFields } from '../common/utils/contact.utils';
import { assertPublicOrOwner, VisibilityViewer } from '../common/public-visibility';

@Injectable()
export class EquipmentListingsService {
  private readonly logger = new Logger(EquipmentListingsService.name);

  constructor(
    private readonly geoService: GeoService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly sellerContactGate: SellerContactGate,
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
    const where: Prisma.EquipmentListingWhereInput = { status: 'ACTIVE', hiddenByOwnerStatus: false };

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

  async findOne(id: string, viewer?: VisibilityViewer | string | null) {
    const item = await this.prisma.equipmentListing.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
        images: { orderBy: { order: 'asc' } },
        governorateRef: true,
        wilayaRef: true,
      },
    });
    if (!item) throw new NotFoundException('الإعلان غير موجود');
    assertPublicOrOwner('equipmentListing', item, item.userId, viewer, 'الإعلان غير موجود');
    // TODO: migrate viewCount to Redis INCR + periodic sync for high traffic
    this.prisma.equipmentListing.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    return item;
  }

  async findBySlug(slug: string, viewer?: VisibilityViewer | string | null) {
    const item = await this.prisma.equipmentListing.findUnique({
      where: { slug },
      include: {
        user: { select: USER_SELECT },
        images: { orderBy: { order: 'asc' } },
        governorateRef: true,
        wilayaRef: true,
      },
    });
    if (!item) throw new NotFoundException('الإعلان غير موجود');
    assertPublicOrOwner('equipmentListing', item, item.userId, viewer, 'الإعلان غير موجود');
    this.prisma.equipmentListing.update({ where: { slug }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    return item;
  }

  async my(userId: string, page = 1, limit = 20) {
    limit = Math.min(limit, 50);
    const skip = (page - 1) * limit;
    const where = { userId };

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
    if (!item) throw new NotFoundException('الإعلان غير موجود');
    if (item.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    const cleanDto = stripDeprecatedContactFields(dto);

    if (cleanDto.governorateId || cleanDto.wilayaId) {
      const targetGov = cleanDto.governorateId ?? item.governorateId;
      const targetWilaya = cleanDto.wilayaId ?? item.wilayaId;
      if (targetGov && targetWilaya) {
        await this.geoService.validateLocationPair(targetGov, targetWilaya);
      }
    }

    const data: Record<string, unknown> = {};
    
    const effectiveListingType = dto.listingType ?? item.listingType;
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

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.equipmentListing.update({
        where: { id },
        data,
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
          entityId: res.id,
          action: 'UPSERT',
        },
      });

      return res;
    });

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      if (dto.latitude && dto.longitude) {
        await this.geoService.syncLocation('equipment_listings', updated.id, dto.latitude, dto.longitude);
      } else if (dto.latitude === null || dto.longitude === null) {
        await this.geoService.clearLocation('equipment_listings', updated.id);
      }
    }

    this.emitListingEvent(LISTING_EVENTS.UPDATED, updated);
    return updated;
  }

  async remove(id: string, userId: string) {
    const item = await this.prisma.equipmentListing.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('الإعلان غير موجود');
    if (item.userId !== userId) throw new ForbiddenException('لا يمكنك حذف إعلان غيرك');
    await this.prisma.$transaction(async (tx) => {
      await tx.equipmentListing.delete({ where: { id } });
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
    if (!item) throw new NotFoundException('الإعلان غير موجود');
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
    const img = await this.prisma.equipmentListingImage.findUnique({ where: { id: imageId }, include: { equipmentListing: true } });
    if (!img) throw new NotFoundException('الصورة غير موجودة');
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
