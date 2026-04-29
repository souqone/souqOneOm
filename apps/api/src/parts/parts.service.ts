import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService, INDEXES } from '../search/search.service';
import { CreatePartDto } from './dto/create-part.dto';
import { QueryPartsDto } from './dto/query-parts.dto';
import { USER_SELECT } from '../common/utils/entity.utils';

@Injectable()
export class PartsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
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

  async create(dto: CreatePartDto, sellerId: string) {
    const slug = this.generateSlug(dto.title);

    const part = await this.prisma.sparePart.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        partCategory: dto.partCategory,
        condition: dto.condition ?? 'USED',
        partNumber: dto.partNumber,
        compatibleMakes: dto.compatibleMakes ?? [],
        compatibleModels: dto.compatibleModels ?? [],
        yearFrom: dto.yearFrom,
        yearTo: dto.yearTo,
        isOriginal: dto.isOriginal ?? false,
        price: new Prisma.Decimal(dto.price),
        currency: dto.currency ?? 'OMR',
        isPriceNegotiable: dto.isPriceNegotiable ?? false,
        governorate: dto.governorate,
        city: dto.city,
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactPhone: dto.contactPhone,
        whatsapp: dto.whatsapp,
        sellerId,
      },
      include: { seller: { select: { id: true, username: true, displayName: true, avatarUrl: true, phone: true, governorate: true } }, images: true },
    });

    // Sync to Meilisearch
    this.searchService.indexDocument(INDEXES.PARTS, {
      id: part.id, title: part.title, slug: part.slug, description: part.description,
      partCategory: part.partCategory, condition: part.condition, partNumber: part.partNumber,
      compatibleMakes: part.compatibleMakes, price: Number(part.price), currency: part.currency,
      isOriginal: part.isOriginal, governorate: part.governorate, city: part.city,
      status: part.status, imageUrl: part.images?.[0]?.url || null, createdAt: part.createdAt,
    }).catch(() => {});

    return part;
  }

  async findAll(query: QueryPartsDto) {
    const page = parseInt(query.page ?? '1');
    const limit = Math.min(parseInt(query.limit ?? '20'), 50);
    const skip = (page - 1) * limit;

    const where: Prisma.SparePartWhereInput = { status: 'ACTIVE' };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.partCategory) where.partCategory = query.partCategory;
    if (query.condition) where.condition = query.condition;
    if (query.make) where.compatibleMakes = { has: query.make };
    if (query.governorate) where.governorate = query.governorate;
    if (query.sellerId) where.sellerId = query.sellerId;
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = new Prisma.Decimal(query.minPrice);
      if (query.maxPrice) where.price.lte = new Prisma.Decimal(query.maxPrice);
    }

    const [items, total] = await Promise.all([
      this.prisma.sparePart.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: { select: USER_SELECT },
          images: { orderBy: { order: 'asc' }, take: 1 },
        },
      }),
      this.prisma.sparePart.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const part = await this.prisma.sparePart.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, username: true, displayName: true, avatarUrl: true, phone: true, governorate: true, isVerified: true, createdAt: true } },
        images: { orderBy: { order: 'asc' } },
      },
    });
    if (!part) throw new NotFoundException('قطعة الغيار غير موجودة');

    await this.prisma.sparePart.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return part;
  }

  async myParts(userId: string) {
    return this.prisma.sparePart.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { order: 'asc' }, take: 1 } },
    });
  }

  async update(id: string, userId: string, dto: Partial<CreatePartDto>) {
    const part = await this.prisma.sparePart.findUnique({ where: { id } });
    if (!part) throw new NotFoundException('قطعة الغيار غير موجودة');
    if (part.sellerId !== userId) throw new ForbiddenException('غير مصرح لك بتعديل هذا الإعلان');

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.partCategory !== undefined) data.partCategory = dto.partCategory;
    if (dto.condition !== undefined) data.condition = dto.condition;
    if (dto.partNumber !== undefined) data.partNumber = dto.partNumber;
    if (dto.compatibleMakes !== undefined) data.compatibleMakes = dto.compatibleMakes;
    if (dto.compatibleModels !== undefined) data.compatibleModels = dto.compatibleModels;
    if (dto.yearFrom !== undefined) data.yearFrom = dto.yearFrom;
    if (dto.yearTo !== undefined) data.yearTo = dto.yearTo;
    if (dto.isOriginal !== undefined) data.isOriginal = dto.isOriginal;
    if (dto.price !== undefined) data.price = new Prisma.Decimal(dto.price);
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.isPriceNegotiable !== undefined) data.isPriceNegotiable = dto.isPriceNegotiable;
    if (dto.governorate !== undefined) data.governorate = dto.governorate;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone;
    if (dto.whatsapp !== undefined) data.whatsapp = dto.whatsapp;

    const updated = await this.prisma.sparePart.update({ where: { id }, data, include: { images: { take: 1, orderBy: { order: 'asc' } } } });

    // Sync to Meilisearch
    this.searchService.indexDocument(INDEXES.PARTS, {
      id: updated.id, title: updated.title, slug: updated.slug, description: updated.description,
      partCategory: updated.partCategory, condition: updated.condition, partNumber: updated.partNumber,
      compatibleMakes: updated.compatibleMakes, price: Number(updated.price), currency: updated.currency,
      isOriginal: updated.isOriginal, governorate: updated.governorate, city: updated.city,
      status: updated.status, imageUrl: updated.images?.[0]?.url || null, createdAt: updated.createdAt,
    }).catch(() => {});

    return updated;
  }

  async remove(id: string, userId: string) {
    const part = await this.prisma.sparePart.findUnique({ where: { id } });
    if (!part) throw new NotFoundException('قطعة الغيار غير موجودة');
    if (part.sellerId !== userId) throw new ForbiddenException('غير مصرح لك بحذف هذا الإعلان');

    await this.prisma.sparePart.delete({ where: { id } });

    // Clean up orphaned conversations & favorites
    await this.prisma.cleanupPolymorphicOrphans('SPARE_PART', id);

    // Remove from Meilisearch
    this.searchService.removeDocument(INDEXES.PARTS, id).catch(() => {});

    return { message: 'تم حذف الإعلان بنجاح' };
  }
}
