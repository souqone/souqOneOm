import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../locations/geo.service';
import { CreateEmployerProfileDto } from './dto/create-employer-profile.dto';
import { UpdateEmployerProfileDto } from './dto/update-employer-profile.dto';
import { SellerContactGate } from '../common/services/seller-contact-gate.service';
import { stripDeprecatedContactFields } from '../common/utils/contact.utils';
import { assertPublicOrOwner, VisibilityViewer } from '../common/public-visibility';

/** Public profile — no phone number exposed to unauthenticated callers (LEAK-2) */
const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  createdAt: true,
};

/** Private profile — returned only to the profile owner */
const PRIVATE_USER_SELECT = {
  ...PUBLIC_USER_SELECT,
  phone: true,
};

@Injectable()
export class EmployerProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geoService: GeoService,
    private readonly sellerContactGate: SellerContactGate,
  ) {}

  /* ───── CREATE ───── */
  async create(userId: string, dto: CreateEmployerProfileDto) {
    await this.sellerContactGate.assertCanPublish(userId);
    const existing = await this.prisma.employerProfile.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('لديك بروفايل صاحب عمل بالفعل');

    const cleanDto = stripDeprecatedContactFields(dto);
    await this.geoService.validateLocationPair(cleanDto.governorateId, cleanDto.wilayaId);

    return this.prisma.employerProfile.create({
      data: {
        userId,
        companyName: cleanDto.companyName,
        companySize: cleanDto.companySize,
        industry: cleanDto.industry,
        bio: cleanDto.bio,
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

  /* ───── GET MY PROFILE (owner — includes phone) ───── */
  async getMyProfile(userId: string) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: PRIVATE_USER_SELECT },
        governorateRef: true,
        wilayaRef: true,
      },
    });
    if (!profile) throw new NotFoundException('لا يوجد بروفايل صاحب عمل');
    return profile;
  }

  /* ───── UPDATE ───── */
  async update(userId: string, dto: UpdateEmployerProfileDto) {
    const profile = await this.prisma.employerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('لا يوجد بروفايل صاحب عمل');

    const cleanDto = stripDeprecatedContactFields(dto);
    const nextGovId = cleanDto.governorateId !== undefined ? cleanDto.governorateId : profile.governorateId;
    const nextWilayaId = cleanDto.wilayaId !== undefined ? cleanDto.wilayaId : profile.wilayaId;
    if (nextGovId || nextWilayaId) {
      await this.geoService.validateLocationPair(nextGovId ?? undefined, nextWilayaId ?? undefined);
    }

    const data: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(cleanDto)) {
      if (val !== undefined) data[key] = val;
    }

    return this.prisma.employerProfile.update({
      where: { userId },
      data,
      include: {
        user: { select: PRIVATE_USER_SELECT },
        governorateRef: true,
        wilayaRef: true,
      },
    });
  }

  /* ───── FIND ONE BY ID (public — no phone) ───── */
  async findOne(id: string, viewer?: VisibilityViewer | string | null) {
    const profile = await this.prisma.employerProfile.findUnique({
      where: { id },
      include: {
        user: { select: PUBLIC_USER_SELECT },
        governorateRef: true,
        wilayaRef: true,
      },
    });
    if (!profile) throw new NotFoundException('بروفايل صاحب العمل غير موجود');
    assertPublicOrOwner('employerProfile', profile, profile.userId, viewer, 'بروفايل صاحب العمل غير موجود');
    return profile;
  }
}
