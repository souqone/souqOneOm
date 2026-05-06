import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, EquipmentType, EquipmentRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateEquipmentRequestDto } from './dto/create-equipment-request.dto';
import { UpdateEquipmentRequestDto } from './dto/update-equipment-request.dto';
import { QueryEquipmentRequestsDto } from './dto/query-equipment-requests.dto';
import { USER_SELECT, generateSlug, MAX_IMAGES_PER_REQUEST } from './equipment.utils';

/** Valid status transitions enforced as a state machine. */
const STATUS_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['CLOSED', 'CANCELLED'],
  CLOSED: [],
  CANCELLED: [],
};

@Injectable()
export class EquipmentRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  async create(dto: CreateEquipmentRequestDto, userId: string) {
    return this.prisma.equipmentRequest.create({
      data: {
        title: dto.title,
        slug: generateSlug(dto.title),
        description: dto.description,
        equipmentType: dto.equipmentType as EquipmentType,
        quantity: dto.quantity ?? 1,
        budgetMin: dto.budgetMin != null ? new Prisma.Decimal(dto.budgetMin) : null,
        budgetMax: dto.budgetMax != null ? new Prisma.Decimal(dto.budgetMax) : null,
        currency: dto.currency ?? 'OMR',
        rentalDuration: dto.rentalDuration,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        withOperator: dto.withOperator ?? false,
        governorate: dto.governorate,
        city: dto.city,
        siteDetails: dto.siteDetails,
        latitude: dto.latitude,
        longitude: dto.longitude,
        contactPhone: dto.contactPhone,
        whatsapp: dto.whatsapp,
        userId,
      },
      include: { user: { select: USER_SELECT }, bids: { include: { user: { select: USER_SELECT } } }, images: true },
    });
  }

  async findAll(q: QueryEquipmentRequestsDto) {
    const page = q.page ?? 1;
    const limit = Math.min(q.limit ?? 20, 50);
    const where: Prisma.EquipmentRequestWhereInput = {};
    if (q.requestStatus) where.requestStatus = q.requestStatus as EquipmentRequestStatus;
    else where.requestStatus = 'OPEN';
    if (q.equipmentType) where.equipmentType = q.equipmentType as EquipmentType;
    if (q.governorate) where.governorate = q.governorate;
    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: 'insensitive' } },
        { description: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.EquipmentRequestOrderByWithRelationInput =
      q.sortBy === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.equipmentRequest.findMany({
        where, orderBy, skip: (page - 1) * limit, take: limit,
        include: { user: { select: USER_SELECT }, _count: { select: { bids: true } }, images: { orderBy: { createdAt: 'asc' }, take: 1 } },
      }),
      this.prisma.equipmentRequest.count({ where }),
    ]);
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const item = await this.prisma.equipmentRequest.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
        bids: { include: { user: { select: USER_SELECT } }, orderBy: { createdAt: 'desc' } },
        images: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!item) throw new NotFoundException('الطلب غير موجود');
    // TODO: migrate viewCount to Redis INCR + periodic sync for high traffic
    this.prisma.equipmentRequest.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    return item;
  }

  async my(userId: string) {
    return this.prisma.equipmentRequest.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' },
      include: { _count: { select: { bids: true } }, images: { orderBy: { createdAt: 'asc' }, take: 1 } },
    });
  }

  async findMyBids(userId: string, page = 1, limit = 20) {
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.equipmentBid.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          request: {
            select: {
              id: true,
              title: true,
              requestStatus: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.equipmentBid.count({ where: { userId } }),
    ]);

    return {
      items,
      meta: { total, page, limit: take, totalPages: Math.ceil(total / take) },
    };
  }

  async update(id: string, userId: string, dto: UpdateEquipmentRequestDto) {
    const item = await this.prisma.equipmentRequest.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('الطلب غير موجود');
    if (item.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل طلب غيرك');

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.quantity !== undefined) data.quantity = dto.quantity;
    if (dto.budgetMin !== undefined) data.budgetMin = new Prisma.Decimal(dto.budgetMin);
    if (dto.budgetMax !== undefined) data.budgetMax = new Prisma.Decimal(dto.budgetMax);
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.rentalDuration !== undefined) data.rentalDuration = dto.rentalDuration;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.withOperator !== undefined) data.withOperator = dto.withOperator;
    if (dto.governorate !== undefined) data.governorate = dto.governorate;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.siteDetails !== undefined) data.siteDetails = dto.siteDetails;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone;
    if (dto.whatsapp !== undefined) data.whatsapp = dto.whatsapp;

    return this.prisma.equipmentRequest.update({
      where: { id }, data,
      include: { user: { select: USER_SELECT }, bids: { include: { user: { select: USER_SELECT } } }, images: { orderBy: { createdAt: 'asc' } } },
    });
  }

  /**
   * Transition the request status using a state machine.
   * Only the request owner can change status.
   */
  async changeStatus(id: string, userId: string, newStatus: string) {
    const item = await this.prisma.equipmentRequest.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('الطلب غير موجود');
    if (item.userId !== userId) throw new ForbiddenException('فقط صاحب الطلب يمكنه تغيير الحالة');

    const allowed = STATUS_TRANSITIONS[item.requestStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `لا يمكن تغيير الحالة من "${item.requestStatus}" إلى "${newStatus}". المسموح: ${allowed.join(', ') || 'لا شيء'}`,
      );
    }

    return this.prisma.equipmentRequest.update({
      where: { id },
      data: { requestStatus: newStatus as EquipmentRequestStatus },
      include: { user: { select: USER_SELECT }, bids: { include: { user: { select: USER_SELECT } } }, images: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async addImages(id: string, userId: string, files: Express.Multer.File[]) {
    const req = await this.prisma.equipmentRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('الطلب غير موجود');
    if (req.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل طلب غيرك');

    const existing = await this.prisma.equipmentRequestImage.count({ where: { requestId: id } });
    if (existing + files.length > MAX_IMAGES_PER_REQUEST) {
      throw new BadRequestException(
        `الحد الأقصى ${MAX_IMAGES_PER_REQUEST} صور لكل طلب — لديك ${existing} حالياً`,
      );
    }

    // Upload each file and persist the resulting URL
    const urls = await Promise.all(files.map((f) => this.uploads.uploadFile(f).then((r) => r.url)));
    await this.prisma.equipmentRequestImage.createMany({
      data: urls.map((url) => ({ url, requestId: id })),
    });

    return this.prisma.equipmentRequest.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
        bids: { include: { user: { select: USER_SELECT } }, orderBy: { createdAt: 'desc' } },
        images: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async remove(id: string, userId: string) {
    const item = await this.prisma.equipmentRequest.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('الطلب غير موجود');
    if (item.userId !== userId) throw new ForbiddenException('لا يمكنك حذف طلب غيرك');
    await this.prisma.equipmentRequest.delete({ where: { id } });

    // Clean up orphaned conversations & favorites
    await this.prisma.cleanupPolymorphicOrphans('EQUIPMENT_REQUEST', id);

    return { deleted: true };
  }
}
