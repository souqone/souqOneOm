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

@Injectable()
export class EquipmentListingsService {
  private readonly logger = new Logger(EquipmentListingsService.name);

  constructor(
    private readonly geoService: GeoService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateEquipmentListingDto, userId: string) {
    if (dto.listingType === 'EQUIPMENT_WANTED') {
      dto.price = undefined;
      dto.dailyPrice = undefined;
      dto.monthlyPrice = undefined;
      dto.make = undefined;
      dto.model = undefined;
      dto.year = undefined;
      dto.condition = undefined;
    } else if (dto.listingType === 'EQUIPMENT_SALE') {
      dto.dailyPrice = undefined;
      dto.monthlyPrice = undefined;
      dto.budgetMin = undefined;
      dto.budgetMax = undefined;
      dto.quantity = undefined;
    } else if (dto.listingType === 'EQUIPMENT_RENT') {
      dto.price = undefined;
      dto.budgetMin = undefined;
      dto.budgetMax = undefined;
      dto.quantity = undefined;
    }
    
    await this.geoService.validateLocationPair(dto.governorateId, dto.wilayaId);

    const item = await this.prisma.$transaction(async (tx) => {
      const createdItem = await tx.equipmentListing.create({
        data: {
          title: dto.title,
          slug: generateSlug(dto.title),
          description: dto.description,
          equipmentType: dto.equipmentType as EquipmentType,
          listingType: dto.listingType as EquipmentListingType,
          make: dto.make,
          model: dto.model,
          year: dto.year,
          condition: (dto.condition as ItemCondition) ?? 'USED',
          capacity: dto.capacity,
          power: dto.power,
          weight: dto.weight,
          hoursUsed: dto.hoursUsed,
          features: dto.features ?? [],
          price: dto.price != null ? new Prisma.Decimal(dto.price) : null,
          dailyPrice: dto.dailyPrice != null ? new Prisma.Decimal(dto.dailyPrice) : null,
          monthlyPrice: dto.monthlyPrice != null ? new Prisma.Decimal(dto.monthlyPrice) : null,
          currency: dto.currency ?? 'OMR',
          isPriceNegotiable: dto.isPriceNegotiable ?? false,
          withOperator: dto.withOperator ?? false,
          deliveryAvailable: dto.deliveryAvailable ?? false,
          budgetMin: dto.budgetMin != null ? new Prisma.Decimal(dto.budgetMin) : null,
          budgetMax: dto.budgetMax != null ? new Prisma.Decimal(dto.budgetMax) : null,
          rentalDuration: dto.rentalDuration,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          quantity: dto.quantity,
          siteDetails: dto.siteDetails,
          governorateId: dto.governorateId,
          wilayaId: dto.wilayaId,
          latitude: dto.latitude,
          longitude: dto.longitude,
          contactPhone: dto.contactPhone,
          whatsapp: dto.whatsapp,
          userId,
          ...(dto.images && dto.images.length > 0 && {
            images: {
              create: dto.images.map((url, i) => ({
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
    const where: Prisma.EquipmentListingWhereInput = { status: 'ACTIVE' };

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

  async findOne(id: string) {
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
    // TODO: migrate viewCount to Redis INCR + periodic sync for high traffic
    this.prisma.equipmentListing.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    return item;
  }

  async findBySlug(slug: string) {
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
    this.prisma.equipmentListing.update({ where: { slug }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    return item;
  }

  async my(userId: string) {
    return this.prisma.equipmentListing.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        governorateRef: true,
        wilayaRef: true,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateEquipmentListingDto) {
    const item = await this.prisma.equipmentListing.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('الإعلان غير موجود');
    if (item.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    if (dto.governorateId || dto.wilayaId) {
      const targetGov = dto.governorateId ?? item.governorateId;
      const targetWilaya = dto.wilayaId ?? item.wilayaId;
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
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone;
    if (dto.whatsapp !== undefined) data.whatsapp = dto.whatsapp;

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
