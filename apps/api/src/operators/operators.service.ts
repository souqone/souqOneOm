import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  OperatorType,
  EquipmentType,
  OperatorDeletionStatus,
  NotificationType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOperatorListingDto } from './dto/create-operator-listing.dto';
import { UpdateOperatorListingDto } from './dto/update-operator-listing.dto';
import { QueryOperatorListingsDto } from './dto/query-operator-listings.dto';
import { USER_SELECT, generateSlug } from '../common/utils/entity.utils';
import { GeoService } from '../locations/geo.service';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';

@Injectable()
export class OperatorsService {
  constructor(
    private readonly geoService: GeoService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateOperatorListingDto, userId: string) {
    const existing = await this.prisma.operatorListing.findFirst({ where: { userId } });
    if (existing) {
      throw new ConflictException('لديك بروفايل مشغّل بالفعل، يمكنك تعديله أو طلب حذفه');
    }

    const recentApproved = await this.prisma.operatorDeletionRequest.findFirst({
      where: { userId, status: OperatorDeletionStatus.APPROVED },
      orderBy: { reviewedAt: 'desc' },
    });
    if (recentApproved?.reviewedAt) {
      const elapsed = Date.now() - recentApproved.reviewedAt.getTime();
      if (elapsed < 72 * 60 * 60 * 1000) {
        throw new ConflictException(
          'لا يمكنك إنشاء بروفايل جديد إلا بعد مرور 72 ساعة من حذف البروفايل السابق',
        );
      }
    }

    await this.geoService.validateLocationPair(dto.governorateId, dto.wilayaId);

    const item = await this.prisma.$transaction(async (tx) => {
      const createdItem = await tx.operatorListing.create({
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
          profileImageUrl: dto.profileImageUrl ?? null,
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

      await tx.outboxEvent.create({
        data: {
          entityType: ENTITY_TYPES.OPERATOR_LISTING,
          entityId: createdItem.id,
          action: 'UPSERT',
        },
      });

      return createdItem;
    });

    if (dto.latitude && dto.longitude) {
      await this.geoService.syncLocation('operator_listings', item.id, dto.latitude, dto.longitude);
    }

    return item;
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

    if (q.minDailyRate !== undefined || q.maxDailyRate !== undefined) {
      where.dailyRate = {
        ...(q.minDailyRate !== undefined ? { gte: new Prisma.Decimal(q.minDailyRate) } : {}),
        ...(q.maxDailyRate !== undefined ? { lte: new Prisma.Decimal(q.maxDailyRate) } : {}),
      };
    }

    if (q.minHourlyRate !== undefined || q.maxHourlyRate !== undefined) {
      where.hourlyRate = {
        ...(q.minHourlyRate !== undefined ? { gte: new Prisma.Decimal(q.minHourlyRate) } : {}),
        ...(q.maxHourlyRate !== undefined ? { lte: new Prisma.Decimal(q.maxHourlyRate) } : {}),
      };
    }

    if (q.minExperienceYears !== undefined || q.maxExperienceYears !== undefined) {
      where.experienceYears = {
        ...(q.minExperienceYears !== undefined ? { gte: q.minExperienceYears } : {}),
        ...(q.maxExperienceYears !== undefined ? { lte: q.maxExperienceYears } : {}),
      };
    }

    const allowedSortFields = ['createdAt', 'dailyRate', 'hourlyRate', 'experienceYears', 'viewCount'];
    const sortField = allowedSortFields.includes(q.sortBy ?? '') ? q.sortBy! : 'createdAt';
    const sortDirection: 'asc' | 'desc' = q.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.OperatorListingOrderByWithRelationInput = { [sortField]: sortDirection };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.operatorListing.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
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

  async findOne(id: string, userId?: string) {
    const item = await this.prisma.operatorListing.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
        governorateRef: true,
        wilayaRef: true,
      },
    });
    if (!item) throw new NotFoundException('إعلان المشغل غير موجود');
    this.prisma.operatorListing.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    let pendingDeletionRequest = null;
    if (userId && item.userId === userId) {
      const pendingRequest = await this.prisma.operatorDeletionRequest.findFirst({
        where: { operatorListingId: item.id, status: OperatorDeletionStatus.PENDING },
        select: { id: true, createdAt: true, status: true },
      });
      pendingDeletionRequest = pendingRequest ?? null;
      return {
        ...item,
        pendingDeletionRequest,
      };
    }

    return item;
  }

  async my(userId: string) {
    const listings = await this.prisma.operatorListing.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        governorateRef: true,
        wilayaRef: true,
      },
    });
    
    return Promise.all(
      listings.map(async (listing) => {
        const pendingRequest = await this.prisma.operatorDeletionRequest.findFirst({
          where: { operatorListingId: listing.id, status: OperatorDeletionStatus.PENDING },
          select: { id: true, createdAt: true, status: true },
        });
        return {
          ...listing,
          pendingDeletionRequest: pendingRequest ?? null,
        };
      })
    );
  }

  async update(id: string, userId: string, dto: UpdateOperatorListingDto) {
    const item = await this.prisma.operatorListing.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('إعلان المشغل غير موجود');
    if (item.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    if (dto.governorateId || dto.wilayaId) {
      const targetGov = dto.governorateId ?? item.governorateId;
      const targetWilaya = dto.wilayaId ?? item.wilayaId;
      if (targetGov && targetWilaya) {
        await this.geoService.validateLocationPair(targetGov, targetWilaya);
      }
    }

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
    if (dto.profileImageUrl !== undefined) data.profileImageUrl = dto.profileImageUrl;
    if (dto.governorateId !== undefined) data.governorateId = dto.governorateId;
    if (dto.wilayaId !== undefined) data.wilayaId = dto.wilayaId;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone;
    if (dto.whatsapp !== undefined) data.whatsapp = dto.whatsapp;

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.operatorListing.update({
        where: { id },
        data,
        include: {
          user: { select: USER_SELECT },
          governorateRef: true,
          wilayaRef: true,
        },
      });

      await tx.outboxEvent.create({
        data: {
          entityType: ENTITY_TYPES.OPERATOR_LISTING,
          entityId: res.id,
          action: 'UPSERT',
        },
      });

      return res;
    });

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      if (dto.latitude && dto.longitude) {
        await this.geoService.syncLocation('operator_listings', updated.id, dto.latitude, dto.longitude);
      } else if (dto.latitude === null || dto.longitude === null) {
        await this.geoService.clearLocation('operator_listings', updated.id);
      }
    }

    return updated;
  }

  async requestDeletion(id: string, userId: string, reason?: string) {
    const item = await this.prisma.operatorListing.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('إعلان المشغل غير موجود');
    if (item.userId !== userId) throw new ForbiddenException('لا يمكنك حذف إعلان غيرك');

    const pending = await this.prisma.operatorDeletionRequest.findFirst({
      where: {
        operatorListingId: id,
        status: OperatorDeletionStatus.PENDING,
      },
    });
    if (pending) {
      throw new ConflictException('يوجد طلب حذف قيد المراجعة بالفعل لهذا الإعلان');
    }

    const request = await this.prisma.operatorDeletionRequest.create({
      data: {
        operatorListingId: id,
        userId,
        reason: reason ?? null,
        status: OperatorDeletionStatus.PENDING,
      },
    });

    return {
      message: 'تم تقديم طلب الحذف بنجاح وهو قيد مراجعة الإدارة',
      request,
    };
  }

  async cancelDeletionRequest(requestId: string, userId: string) {
    const request = await this.prisma.operatorDeletionRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('طلب الحذف غير موجود');
    }
    if (request.userId !== userId) {
      throw new ForbiddenException('لا يمكنك إلغاء طلب حذف لا يخصك');
    }
    if (request.status !== OperatorDeletionStatus.PENDING) {
      throw new BadRequestException('لا يمكن إلغاء طلب تم البت فيه بالفعل أو تم إلغاؤه');
    }

    const elapsedMs = Date.now() - request.createdAt.getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    if (elapsedMs > twentyFourHoursMs) {
      throw new BadRequestException('انتهت مهلة إلغاء طلب الحذف (24 ساعة)، الطلب قيد مراجعة الإدارة الآن');
    }

    return this.prisma.operatorDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: OperatorDeletionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  async adminListDeletionRequests(status?: OperatorDeletionStatus, page = 1, limit = 20) {
    const safeLimit = Math.min(limit, 50);
    const where: Prisma.OperatorDeletionRequestWhereInput = status ? { status } : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.operatorDeletionRequest.findMany({
        where,
        skip: (page - 1) * safeLimit,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          operatorListing: {
            include: {
              user: { select: USER_SELECT },
              governorateRef: true,
              wilayaRef: true,
            },
          },
        },
      }),
      this.prisma.operatorDeletionRequest.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async adminReviewDeletion(
    requestId: string,
    adminId: string,
    decision: 'APPROVED' | 'REJECTED',
    rejectionReason?: string,
  ) {
    const request = await this.prisma.operatorDeletionRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('طلب الحذف غير موجود');
    }
    if (request.status !== OperatorDeletionStatus.PENDING) {
      throw new BadRequestException('هذا الطلب تم البت فيه بالفعل أو تم إلغاؤه');
    }

    const targetListingId = request.operatorListingId;

    if (decision === 'APPROVED') {
      await this.prisma.$transaction(async (tx) => {
        await tx.operatorDeletionRequest.update({
          where: { id: requestId },
          data: {
            status: OperatorDeletionStatus.APPROVED,
            reviewedBy: adminId,
            reviewedAt: new Date(),
          },
        });

        if (targetListingId) {
          await tx.operatorListing.delete({
            where: { id: targetListingId },
          });

          await tx.outboxEvent.create({
            data: {
              entityType: ENTITY_TYPES.OPERATOR_LISTING,
              entityId: targetListingId,
              action: 'DELETE',
            },
          });
        }
      });

      if (targetListingId) {
        await this.prisma.cleanupPolymorphicOrphans('OPERATOR_LISTING', targetListingId);
      }

      await this.notificationsService.create({
        type: NotificationType.OPERATOR_DELETION_APPROVED,
        title: 'تمت الموافقة على طلب الحذف',
        body: 'تمت الموافقة على حذف إعلان المشغل الخاص بك وحذفه بنجاح',
        userId: request.userId,
        data: { operatorListingId: targetListingId ?? undefined },
      });

      return { success: true, status: OperatorDeletionStatus.APPROVED };
    }

    if (decision === 'REJECTED') {
      const updated = await this.prisma.operatorDeletionRequest.update({
        where: { id: requestId },
        data: {
          status: OperatorDeletionStatus.REJECTED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: rejectionReason ?? null,
        },
      });

      await this.notificationsService.create({
        type: NotificationType.OPERATOR_DELETION_REJECTED,
        title: 'تم رفض طلب الحذف',
        body: rejectionReason
          ? `تم رفض طلب حذف إعلان المشغل: ${rejectionReason}`
          : 'تم رفض طلب حذف إعلان المشغل الخاص بك من قبل الإدارة',
        userId: request.userId,
        data: {
          operatorListingId: targetListingId ?? undefined,
          rejectionReason: rejectionReason ?? null,
        },
      });

      return updated;
    }

    throw new BadRequestException('قرار غير صالح');
  }
}
