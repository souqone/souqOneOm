import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SearchService, INDEXES } from '../search/search.service';
import { BaseListingService, ListingConfig } from '../common/services/base-listing.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';

import { GeoService } from '../locations/geo.service';

@Injectable()
export class ServicesService extends BaseListingService {
  protected readonly config: ListingConfig = {
    modelName: 'carService',
    meiliIndex: INDEXES.SERVICES,
    entityType: 'CAR_SERVICE',
    notFoundMsg: 'الخدمة غير موجودة',
    decimalFields: ['priceFrom', 'priceTo'],
  };

  constructor(
    private readonly geoService: GeoService,
prisma: PrismaService, searchService: SearchService, redis: RedisService, eventEmitter: EventEmitter2) {
    super(prisma, searchService, redis, eventEmitter);
  }

  protected buildCreateData(dto: CreateServiceDto, slug: string, userId: string) {
    return {
      title: dto.title,
      slug,
      description: dto.description,
      serviceType: dto.serviceType,
      providerType: dto.providerType,
      providerName: dto.providerName,
      specializations: dto.specializations ?? [],
      priceFrom: dto.priceFrom ? new Prisma.Decimal(dto.priceFrom) : undefined,
      priceTo: dto.priceTo ? new Prisma.Decimal(dto.priceTo) : undefined,
      currency: dto.currency ?? 'OMR',
      isHomeService: dto.isHomeService ?? false,
      workingHoursOpen: dto.workingHoursOpen,
      workingHoursClose: dto.workingHoursClose,
      workingDays: dto.workingDays ?? [],
      governorateId: dto.governorateId,
      wilayaId: dto.wilayaId,
      address: dto.address,
      latitude: dto.latitude,
      longitude: dto.longitude,
      contactPhone: dto.contactPhone,
      whatsapp: dto.whatsapp,
      website: dto.website,
      userId,
    };
  }

  async create(dto: CreateServiceDto, userId: string) {
    await this.geoService.validateLocationPair(dto.governorateId, dto.wilayaId);

    const item = await super.create(dto, userId);
    if (dto.latitude && dto.longitude) {
      await this.geoService.syncLocation('car_services', item.id, dto.latitude, dto.longitude);
    }
    return item;
  }

  async update(id: string, userId: string, dto: Partial<CreateServiceDto>) {
    const existing = await this.prisma.carService.findUnique({ where: { id } });
    if (existing) {
      const nextGovId = dto.governorateId !== undefined ? dto.governorateId : existing.governorateId;
      const nextWilayaId = dto.wilayaId !== undefined ? dto.wilayaId : existing.wilayaId;
      if (nextGovId || nextWilayaId) {
        await this.geoService.validateLocationPair(nextGovId ?? undefined, nextWilayaId ?? undefined);
      }
    }

    const item = await super.update(id, userId, dto);
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      if (dto.latitude && dto.longitude) {
        await this.geoService.syncLocation('car_services', item.id, dto.latitude, dto.longitude);
      } else if (dto.latitude === null || dto.longitude === null) {
        await this.geoService.clearLocation('car_services', item.id);
      }
    }
    return item;
  }

  async findAll(query: QueryServicesDto) {
    if (query.latitude && query.longitude) {
      const page = parseInt(query.page ?? '1');
      const limit = Math.min(parseInt(query.limit ?? '20'), 50);
      const skip = (page - 1) * limit;

      const queryHash = Buffer.from(JSON.stringify(query)).toString('base64url');
      const cacheKey = `${this.config.modelName}:list:${queryHash}`;
      const cached = await this.redis.get<any>(cacheKey);
      if (cached) return cached;

      const where = { status: 'ACTIVE', ...this.buildWhereFilter(query) };
      
      const allItems = await this.model.findMany({
        where,
        include: this.getListInclude(),
      });

      const radius = query.radiusKm || 10;

      const withDistance = allItems.map((item: any) => {
        if (item.latitude === null || item.longitude === null || item.latitude === undefined || item.longitude === undefined) {
          return { ...item, distance: null };
        }
        const distance = this.calculateDistance(
          query.latitude!, query.longitude!,
          item.latitude, item.longitude
        );
        return { ...item, distance };
      });

      const filtered = withDistance
        .filter((item: any) => item.distance !== null && item.distance <= radius)
        .sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));

      const total = filtered.length;
      const items = filtered.slice(skip, skip + limit);

      const result = { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
      await this.redis.set(cacheKey, result, 300);
      return result;
    }

    return super.findAll(query);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  protected buildMeiliDoc(item: any) {
    return {
      id: item.id, title: item.title, slug: item.slug, description: item.description,
      serviceType: item.serviceType, providerName: item.providerName, providerType: item.providerType,
      priceFrom: item.priceFrom ? Number(item.priceFrom) : null, currency: item.currency,
      governorateId: item.governorateId, wilayaId: item.wilayaId, isHomeService: item.isHomeService,
      status: item.status, imageUrl: item.images?.[0]?.url || null, createdAt: item.createdAt,
    };
  }

  protected buildWhereFilter(query: QueryServicesDto) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { providerName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.serviceType) where.serviceType = query.serviceType;
    if (query.providerType) where.providerType = query.providerType;
    if (query.governorateId) where.governorateId = parseInt(query.governorateId);
    if (query.wilayaId) where.wilayaId = parseInt(query.wilayaId);
    if (query.isHomeService !== undefined) where.isHomeService = query.isHomeService;
    if (query.userId) where.userId = query.userId;

    if (query.specializations && query.specializations.length > 0) {
      where.specializations = { hasSome: query.specializations };
    }

    if (query.isOpenNow) {
      const omanTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Muscat" }));
      const dayIndex = omanTime.getDay();
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const currentDay = days[dayIndex];
      const currentHour = omanTime.getHours().toString().padStart(2, '0');
      const currentMinute = omanTime.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;

      where.workingDays = { has: currentDay };
      where.workingHoursOpen = { lte: currentTime };
      where.workingHoursClose = { gt: currentTime };
    }

    return where;
  }
}
