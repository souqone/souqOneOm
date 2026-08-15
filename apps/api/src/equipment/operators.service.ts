import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, OperatorType, EquipmentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOperatorListingDto } from './dto/create-operator-listing.dto';
import { UpdateOperatorListingDto } from './dto/update-operator-listing.dto';
import { QueryOperatorListingsDto } from './dto/query-operator-listings.dto';
import { USER_SELECT, generateSlug } from './equipment.utils';

@Injectable()
export class OperatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOperatorListingDto, userId: string) {
    return this.prisma.operatorListing.create({
      data: {
        title: dto.title,
        slug: generateSlug(dto.title),
        description: dto.description,
        operatorType: dto.operatorType as OperatorType,
        specializations: dto.specializations ?? [],
        experienceYears: dto.experienceYears,
        equipmentTypes: (dto.equipmentTypes ?? []) as EquipmentType[],
        certifications: dto.certifications ?? [],
        dailyRate: dto.dailyRate != null ? new Prisma.Decimal(dto.dailyRate) : null,
        hourlyRate: dto.hourlyRate != null ? new Prisma.Decimal(dto.hourlyRate) : null,
        currency: dto.currency ?? 'OMR',
        isPriceNegotiable: dto.isPriceNegotiable ?? false,
        governorateId: dto.governorateId,
        wilayaId: dto.wilayaId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactPhone: dto.contactPhone,
        whatsapp: dto.whatsapp,
        userId,
      },
      include: {
        user: { select: USER_SELECT },
        governorateRef: true,
        wilayaRef: true,
      },
    });
  }

  async findAll(q: QueryOperatorListingsDto) {
    const page = q.page ?? 1;
    const limit = Math.min(q.limit ?? 20, 50);
    const where: Prisma.OperatorListingWhereInput = { status: 'ACTIVE' };
    if (q.operatorType) where.operatorType = q.operatorType as OperatorType;
    if (q.governorateId) where.governorateId = q.governorateId;
    if (q.wilayaId) where.wilayaId = q.wilayaId;
    if (q.userId) where.userId = q.userId;
    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: 'insensitive' } },
        { description: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.OperatorListingOrderByWithRelationInput = { createdAt: 'desc' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.operatorListing.findMany({
        where, orderBy, skip: (page - 1) * limit, take: limit,
        include: {
          user: { select: USER_SELECT },
          governorateRef: true,
          wilayaRef: true,
        },
      }),
      this.prisma.operatorListing.count({ where }),
    ]);
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const item = await this.prisma.operatorListing.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
        governorateRef: true,
        wilayaRef: true,
      },
    });
    if (!item) throw new NotFoundException('إعلان المشغل غير موجود');
    // TODO: migrate viewCount to Redis INCR + periodic sync for high traffic
    this.prisma.operatorListing.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    return item;
  }

  async my(userId: string) {
    return this.prisma.operatorListing.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        governorateRef: true,
        wilayaRef: true,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateOperatorListingDto) {
    const item = await this.prisma.operatorListing.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('إعلان المشغل غير موجود');
    if (item.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.specializations !== undefined) data.specializations = dto.specializations;
    if (dto.experienceYears !== undefined) data.experienceYears = dto.experienceYears;
    if (dto.equipmentTypes !== undefined) data.equipmentTypes = dto.equipmentTypes as EquipmentType[];
    if (dto.certifications !== undefined) data.certifications = dto.certifications;
    if (dto.dailyRate !== undefined) data.dailyRate = new Prisma.Decimal(dto.dailyRate);
    if (dto.hourlyRate !== undefined) data.hourlyRate = new Prisma.Decimal(dto.hourlyRate);
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.isPriceNegotiable !== undefined) data.isPriceNegotiable = dto.isPriceNegotiable;
    if (dto.governorateId !== undefined) data.governorateId = dto.governorateId;
    if (dto.wilayaId !== undefined) data.wilayaId = dto.wilayaId;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone;
    if (dto.whatsapp !== undefined) data.whatsapp = dto.whatsapp;

    return this.prisma.operatorListing.update({
      where: { id },
      data,
      include: {
        user: { select: USER_SELECT },
        governorateRef: true,
        wilayaRef: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    const item = await this.prisma.operatorListing.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('إعلان المشغل غير موجود');
    if (item.userId !== userId) throw new ForbiddenException('لا يمكنك حذف إعلان غيرك');
    await this.prisma.operatorListing.delete({ where: { id } });
    return { deleted: true };
  }
}
