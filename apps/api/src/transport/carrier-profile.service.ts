import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarrierProfileDto } from './dto/create-carrier-profile.dto';
import { UpdateCarrierProfileDto } from './dto/update-carrier-profile.dto';
import { QueryCarriersDto } from './dto/query-carriers.dto';
import { Prisma } from '@prisma/client';

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  phone: true,
  governorate: true,
  isVerified: true,
  createdAt: true,
};

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

@Injectable()
export class CarrierProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCarrierProfileDto) {
    const existing = await this.prisma.carrierProfile.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('لديك ملف تعريف ناقل بالفعل');

    return this.prisma.carrierProfile.create({
      data: {
        userId,
        companyName: dto.companyName,
        bio: dto.bio,
        vehicleTypes: dto.vehicleTypes,
        serviceTypes: dto.serviceTypes,
        governorate: dto.governorate,
        city: dto.city,
        contactPhone: dto.contactPhone,
        whatsapp: dto.whatsapp,
      },
      include: { user: { select: USER_SELECT } },
    });
  }

  async getMyProfile(userId: string) {
    const profile = await this.prisma.carrierProfile.findUnique({
      where: { userId },
      include: { user: { select: USER_SELECT } },
    });
    if (!profile) throw new NotFoundException('لم يتم العثور على ملف الناقل');
    return profile;
  }

  async update(userId: string, dto: UpdateCarrierProfileDto) {
    const profile = await this.prisma.carrierProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('لم يتم العثور على ملف الناقل');

    return this.prisma.carrierProfile.update({
      where: { userId },
      data: dto,
      include: { user: { select: USER_SELECT } },
    });
  }

  async findOne(id: string) {
    const profile = await this.prisma.carrierProfile.findUnique({
      where: { id },
      include: { user: { select: USER_SELECT } },
    });
    if (!profile) throw new NotFoundException('الناقل غير موجود');
    return profile;
  }

  async findAll(query: QueryCarriersDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit || String(DEFAULT_LIMIT), 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.CarrierProfileWhereInput = {};

    if (query.governorate) where.governorate = query.governorate;
    if (query.isAvailable !== undefined) where.isAvailable = query.isAvailable;
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
        include: { user: { select: USER_SELECT } },
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
      this.prisma.transportRequest.count({ where: { status: 'OPEN' } }),
      this.prisma.carrierProfile.count({ where: { isVerified: true } }),
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
    });
  }
}
