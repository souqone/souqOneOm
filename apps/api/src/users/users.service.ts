import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../locations/geo.service';
import { AuthTokenService } from '../auth/auth-token.service';
import { AccessTokenGate } from '../auth/access-token-gate.service';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  USER_SELECT_PROFILE_PUBLIC,
  USER_SELECT_PROFILE_PRIVATE,
} from '../common/constants/user-select.constant';
import { validateTrustedImageUrl } from '../common/utils/image-url.validator';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geoService: GeoService,
    private readonly authTokenService: AuthTokenService,
    private readonly accessTokenGate: AccessTokenGate,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT_PROFILE_PRIVATE,
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return user;
  }

  async getPublicProfile(userId: string) {
    const activeWhere = { where: { status: 'ACTIVE' as const, hiddenByOwnerStatus: false } };
    const busActiveWhere = { where: { status: 'ACTIVE' as const, hiddenByOwnerStatus: false, deletedAt: null } };
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...USER_SELECT_PROFILE_PUBLIC,
        _count: {
          select: {
            listings: activeWhere,
            busListings: busActiveWhere,
            equipmentListings: activeWhere,
            operatorListings: activeWhere,
            spareParts: activeWhere,
            carServices: activeWhere,
            driverJobs: activeWhere,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const counts = user._count;
    const totalListings =
      counts.listings +
      counts.busListings +
      counts.equipmentListings +
      counts.operatorListings +
      counts.spareParts +
      counts.carServices +
      counts.driverJobs;

    return { ...user, totalListings };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // 1. Display name validation: cannot be null
    if (dto.displayName === null) {
      throw new BadRequestException('الاسم المعروض مطلوب ولا يمكن حذفه');
    }

    // 2. Phone validation: cannot be deleted (null or empty string)
    if (dto.phone !== undefined) {
      if (dto.phone === null || (typeof dto.phone === 'string' && dto.phone.trim() === '')) {
        throw new BadRequestException('رقم الهاتف مطلوب ولا يمكن حذفه');
      }
    }

    // 3. Location validation: governorateId and wilayaId cannot be null
    if (dto.governorateId === null || dto.wilayaId === null) {
      throw new BadRequestException('المحافظة والولاية لا يمكن حذفهما');
    }

    const nextGovId = dto.governorateId !== undefined ? dto.governorateId : user.governorateId;
    const nextWilayaId = dto.wilayaId !== undefined ? dto.wilayaId : user.wilayaId;
    if (nextGovId && nextWilayaId) {
      await this.geoService.validateLocationPair(nextGovId, nextWilayaId);
    }

    // 4. Bio handling: null or empty string resets bio to null in DB
    let nextBio: string | null | undefined = undefined;
    if (dto.bio !== undefined) {
      if (dto.bio === null || (typeof dto.bio === 'string' && dto.bio.trim() === '')) {
        nextBio = null;
      } else {
        nextBio = dto.bio.trim();
      }
    }

    // 5. Avatar URL handling: null or empty string clears avatar; new URL must be trusted; unchanged stored URL allowed
    let nextAvatarUrl: string | null | undefined = undefined;
    if (dto.avatarUrl !== undefined) {
      if (dto.avatarUrl === null || dto.avatarUrl === '') {
        nextAvatarUrl = null;
      } else {
        if (dto.avatarUrl !== user.avatarUrl) {
          validateTrustedImageUrl(dto.avatarUrl);
        }
        nextAvatarUrl = dto.avatarUrl;
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(nextBio !== undefined && { bio: nextBio }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.governorateId !== undefined && { governorateId: dto.governorateId }),
        ...(dto.wilayaId !== undefined && { wilayaId: dto.wilayaId }),
        ...(nextAvatarUrl !== undefined && { avatarUrl: nextAvatarUrl }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      },
      select: USER_SELECT_PROFILE_PRIVATE,
    });

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      if (dto.latitude && dto.longitude) {
        await this.geoService.syncLocation('users', userId, dto.latitude, dto.longitude);
      } else if (dto.latitude === null || dto.longitude === null) {
        await this.geoService.clearLocation('users', userId);
      }
    }

    return updated;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('هذا الحساب مسجل بواسطة Google ولا يحتوي على كلمة مرور.');
    }
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('كلمة المرور الحالية غير صحيحة');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          tokenVersion: { increment: 1 },
        },
      });
      await this.authTokenService.revokeAllRefreshTokens(userId, tx);
      return u;
    });

    await this.accessTokenGate.invalidate(userId);

    const accessToken = await this.authTokenService.signAccessToken(updatedUser);
    const refreshToken = await this.authTokenService.generateRefreshToken(updatedUser.id);

    return {
      message: 'تم تغيير كلمة المرور بنجاح',
      accessToken,
      refreshToken,
    };
  }

  async getActiveSessions(userId: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, familyId: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const seenFamilies = new Set<string>();
    const uniqueSessions: Array<{ id: string; createdAt: Date; expiresAt: Date }> = [];
    for (const session of sessions) {
      if (session.familyId) {
        if (seenFamilies.has(session.familyId)) {
          continue;
        }
        seenFamilies.add(session.familyId);
      }
      uniqueSessions.push({
        id: session.id,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      });
    }

    return uniqueSessions;
  }

  async revokeSession(userId: string, sessionId: string) {
    const token = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId, revokedAt: null },
    });
    if (!token) {
      throw new NotFoundException('الجلسة غير موجودة أو منتهية');
    }
    const now = new Date();
    if (token.familyId) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, familyId: token.familyId, revokedAt: null },
        data: { revokedAt: now },
      });
    } else {
      await this.prisma.refreshToken.update({
        where: { id: sessionId },
        data: { revokedAt: now },
      });
    }
    return { message: 'تم إنهاء الجلسة بنجاح' };
  }

  async revokeAllSessions(userId: string) {
    const { count } = await this.prisma.$transaction(async (tx) => {
      const res = await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      });
      return res;
    });
    await this.accessTokenGate.invalidate(userId);
    return { message: `تم إنهاء ${count} جلسة بنجاح` };
  }

  async getLoginHistory(userId: string) {
    return this.prisma.loginAudit.findMany({
      where: { userId },
      select: {
        id: true, success: true, method: true,
        ipAddress: true, userAgent: true, reason: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
