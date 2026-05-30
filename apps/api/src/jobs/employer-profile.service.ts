import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployerProfileDto } from './dto/create-employer-profile.dto';
import { UpdateEmployerProfileDto } from './dto/update-employer-profile.dto';

/** Public profile — no phone number exposed to unauthenticated callers (LEAK-2) */
const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  governorate: true,
  createdAt: true,
};

/** Private profile — returned only to the profile owner */
const PRIVATE_USER_SELECT = {
  ...PUBLIC_USER_SELECT,
  phone: true,
};

@Injectable()
export class EmployerProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /* ───── CREATE ───── */
  async create(userId: string, dto: CreateEmployerProfileDto) {
    const existing = await this.prisma.employerProfile.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('لديك بروفايل صاحب عمل بالفعل');

    return this.prisma.employerProfile.create({
      data: {
        userId,
        companyName: dto.companyName,
        companySize: dto.companySize,
        industry: dto.industry,
        bio: dto.bio,
        governorate: dto.governorate,
        city: dto.city,
        contactPhone: dto.contactPhone,
        whatsapp: dto.whatsapp,
      },
      include: { user: { select: PRIVATE_USER_SELECT } },
    });
  }

  /* ───── GET MY PROFILE (owner — includes phone) ───── */
  async getMyProfile(userId: string) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { userId },
      include: { user: { select: PRIVATE_USER_SELECT } },
    });
    if (!profile) throw new NotFoundException('لا يوجد بروفايل صاحب عمل');
    return profile;
  }

  /* ───── UPDATE ───── */
  async update(userId: string, dto: UpdateEmployerProfileDto) {
    const profile = await this.prisma.employerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('لا يوجد بروفايل صاحب عمل');

    const data: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(dto)) {
      if (val !== undefined) data[key] = val;
    }

    return this.prisma.employerProfile.update({
      where: { userId },
      data,
      include: { user: { select: PRIVATE_USER_SELECT } },
    });
  }

  /* ───── FIND ONE BY ID (public — no phone) ───── */
  async findOne(id: string) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { id },
      include: { user: { select: PUBLIC_USER_SELECT } },
    });
    if (!profile) throw new NotFoundException('بروفايل صاحب العمل غير موجود');
    return profile;
  }
}
