import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../locations/geo.service';
import { CreateCarrierProfileDto } from './dto/create-carrier-profile.dto';
import { UpdateCarrierProfileDto } from './dto/update-carrier-profile.dto';
import { QueryCarriersDto } from './dto/query-carriers.dto';
import { Prisma } from '@prisma/client';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';
import { stripDeprecatedContactFields } from '../common/utils/contact.utils';
import { assertPublicOrOwner, VisibilityViewer } from '../common/public-visibility';

/** Public profile — no phone number exposed to unauthenticated callers */
const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  isVerified: true,
  createdAt: true,
};

/** Private profile — returned only to the carrier profile owner */
const PRIVATE_USER_SELECT = {
  ...PUBLIC_USER_SELECT,
  phone: true,
};

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

@Injectable()
export class CarrierProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geoService: GeoService,
    private readonly sellerContactGate: SellerContactGate,
  ) {}

  async create(userId: string, dto: CreateCarrierProfileDto) {
    await this.sellerContactGate.assertCanPublish(userId);
    const existing = await this.prisma.carrierProfile.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('لديك ملف تعريف ناقل بالفعل');

    const cleanDto = stripDeprecatedContactFields(dto);
    await this.geoService.validateLocationPair(cleanDto.governorateId, cleanDto.wilayaId);

    return this.prisma.carrierProfile.create({
      data: {
        userId,
        companyName: cleanDto.companyName,
        bio: cleanDto.bio,
        vehicleTypes: cleanDto.vehicleTypes,
        serviceTypes: cleanDto.serviceTypes,
        governorateId: cleanDto.governorateId,
        wilayaId: cleanDto.wilayaId,
        whatsappEnabled: cleanDto.whatsappEnabled ?? false,
      },
      include: {
        user: { select: PRIVATE_USER_SELECT },
        governorateRef: true,
        wilayaRef: true,
      },
    });
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.carrierProfile.findUnique({
      where: { userId },
      include: {
        user: { select: PRIVATE_USER_SELECT },
        governorateRef: true,
        wilayaRef: true,
      },
    });
    if (!profile) throw new NotFoundException('لم يتم العثور على ملف الناقل');
    return profile;
  }

  async update(userId: string, dto: UpdateCarrierProfileDto) {
    const profile = await this.prisma.carrierProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('لم يتم العثور على ملف الناقل');

    const cleanDto = stripDeprecatedContactFields(dto);
    const nextGovId = cleanDto.governorateId !== undefined ? cleanDto.governorateId : profile.governorateId;
    const nextWilayaId = cleanDto.wilayaId !== undefined ? cleanDto.wilayaId : profile.wilayaId;
    if (nextGovId || nextWilayaId) {
      await this.geoService.validateLocationPair(nextGovId ?? undefined, nextWilayaId ?? undefined);
    }

    return this.prisma.carrierProfile.update({
      where: { userId },
      data: cleanDto,
      include: {
        user: { select: PRIVATE_USER_SELECT },
        governorateRef: true,
        wilayaRef: true,
      },
    });
  }

  async findOne(id: string, viewer?: VisibilityViewer | string | null) {
    const profile = await this.prisma.carrierProfile.findUnique({
      where: { id },
      include: {
        user: { select: PUBLIC_USER_SELECT },
        governorateRef: true,
        wilayaRef: true,
      },
    });
    if (!profile) throw new NotFoundException('الناقل غير موجود');
    assertPublicOrOwner('carrierProfile', profile, profile.userId, viewer, 'الناقل غير موجود');
    return profile;
  }

  async findAll(query: QueryCarriersDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit || String(DEFAULT_LIMIT), 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.CarrierProfileWhereInput = { hiddenByOwnerStatus: false };

    if (query.governorateId) where.governorateId = parseInt(query.governorateId);
    if (query.wilayaId) where.wilayaId = parseInt(query.wilayaId);
    if (query.isAvailable !== undefined) where.isAvailable = query.isAvailable;
    if (query.isVerified !== undefined) where.isVerified = query.isVerified;
    if (query.vehicleType) where.vehicleTypes = { has: query.vehicleType };
    if (query.serviceType) where.serviceTypes = { has: query.serviceType };
    if (query.search) {
      where.OR = [
        { bio: { contains: query.search, mode: 'insensitive' } },
        { companyName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.carrierProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: PUBLIC_USER_SELECT },
          governorateRef: true,
          wilayaRef: true,
        },
      }),
      this.prisma.carrierProfile.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPublicStats() {
    const [activeRequests, verifiedCarriers, completedTrips] = await this.prisma.$transaction([
      this.prisma.transportRequest.count({ where: { status: 'OPEN', hiddenByOwnerStatus: false } }),
      this.prisma.carrierProfile.count({ where: { isVerified: true, hiddenByOwnerStatus: false } }),
      this.prisma.transportBooking.count({ where: { status: 'COMPLETED' } }),
    ]);
    return { activeRequests, verifiedCarriers, completedTrips };
  }

  async setAvailability(userId: string, isAvailable: boolean) {
    const profile = await this.prisma.carrierProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('لم يتم العثور على ملف الناقل');

    return this.prisma.carrierProfile.update({
      where: { userId },
      data: { isAvailable },
      include: {
        user: { select: PRIVATE_USER_SELECT },
        governorateRef: true,
        wilayaRef: true,
      },
    });
  }
}
