import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateDriverProfileDto } from './dto/create-driver-profile.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { QueryDriversDto } from './dto/query-drivers.dto';

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  phone: true,
  governorate: true,
  createdAt: true,
};

@Injectable()
export class DriverProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /* ───── CREATE ───── */
  async create(userId: string, dto: CreateDriverProfileDto) {
    const existing = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('لديك بروفايل سائق بالفعل');

    return this.prisma.driverProfile.create({
      data: {
        userId,
        licenseTypes: dto.licenseTypes,
        experienceYears: dto.experienceYears,
        languages: dto.languages ?? [],
        nationality: dto.nationality,
        vehicleTypes: dto.vehicleTypes ?? [],
        hasOwnVehicle: dto.hasOwnVehicle ?? false,
        bio: dto.bio,
        governorate: dto.governorate,
        city: dto.city,
        contactPhone: dto.contactPhone,
        whatsapp: dto.whatsapp,
      },
      include: { user: { select: USER_SELECT } },
    });
  }

  /* ───── GET MY PROFILE ───── */
  async getMyProfile(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: { user: { select: USER_SELECT } },
    });
    if (!profile) throw new NotFoundException('لا يوجد بروفايل سائق');
    return profile;
  }

  /* ───── UPDATE ───── */
  async update(userId: string, dto: UpdateDriverProfileDto) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('لا يوجد بروفايل سائق');

    const data: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(dto)) {
      if (val !== undefined) data[key] = val;
    }

    return this.prisma.driverProfile.update({
      where: { userId },
      data,
      include: { user: { select: USER_SELECT } },
    });
  }

  /* ───── FIND ONE BY ID ───── */
  async findOne(id: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { id },
      include: { user: { select: USER_SELECT } },
    });
    if (!profile) throw new NotFoundException('بروفايل السائق غير موجود');
    return profile;
  }

  /* ───── LIST DRIVERS ───── */
  async findAll(query: QueryDriversDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '12', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.DriverProfileWhereInput = {};

    if (query.governorate) where.governorate = query.governorate;
    if (query.isAvailable !== undefined) where.isAvailable = query.isAvailable;
    if (query.isVerified !== undefined) where.isVerified = query.isVerified;
    if (query.licenseType) where.licenseTypes = { has: query.licenseType };

    if (query.search) {
      where.OR = [
        { bio: { contains: query.search, mode: 'insensitive' } },
        { user: { displayName: { contains: query.search, mode: 'insensitive' } } },
        { user: { username: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.driverProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: USER_SELECT } },
      }),
      this.prisma.driverProfile.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ───── GET DRIVER REVIEWS ───── */
  async getReviews(profileId: string, query: { page?: string; limit?: string }) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { id: profileId } });
    if (!profile) throw new NotFoundException('بروفايل السائق غير موجود');

    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where = { entityType: 'DRIVER_PROFILE' as const, entityId: profileId };

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
          reply: true,
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
