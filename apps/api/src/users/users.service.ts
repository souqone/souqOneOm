import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../locations/geo.service';
import { AuthTokenService } from '../auth/auth-token.service';
import { AccessTokenGate } from '../auth/access-token-gate.service';
import { AuthService } from '../auth/auth.service';
import { OwnerContentVisibilityService } from '../common/services/owner-content-visibility.service';
import { OWNER_VISIBILITY_REGISTRY } from '../common/constants/owner-visibility.registry';
import { MailService } from '../mail/mail.service';
import { redactEmails } from '../common/utils/mask-email';
import { DeleteAccountDto } from './dto/delete-account.dto';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  USER_SELECT_PROFILE_PUBLIC,
  USER_SELECT_PROFILE_PRIVATE,
} from '../common/constants/user-select.constant';
import { validateTrustedImageUrl } from '../common/utils/image-url.validator';
import { normalizePhone, normalizePhoneStrict } from '../common/utils/normalize-phone';
import { getLoginMethods } from '../auth/login-methods.util';
import { getDeletionReauthMethod } from './deletion-reauth-method.util';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geoService: GeoService,
    private readonly authTokenService: AuthTokenService,
    private readonly accessTokenGate: AccessTokenGate,
    private readonly authService: AuthService,
    private readonly visibilityService: OwnerContentVisibilityService,
    private readonly mailService: MailService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...USER_SELECT_PROFILE_PRIVATE,
        phoneVerifiedAt: true,
        phoneE164: true,
        passwordHash: true,
        googleId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const { phoneVerifiedAt, phoneE164, passwordHash, googleId, ...profile } = user;
    const phoneVerified = Boolean(phoneVerifiedAt && phoneE164);
    const deletionReauthMethod = getDeletionReauthMethod({ passwordHash, googleId });

    return { ...profile, phoneVerified, deletionReauthMethod };
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

    // 2. Phone validation & normalization
    let nextPhone: string | undefined = undefined;
    let isPhoneChanged = false;

    if (dto.phone !== undefined) {
      if (
        dto.phone === null ||
        (typeof dto.phone === 'string' && dto.phone.trim() === '')
      ) {
        throw new BadRequestException('رقم الهاتف مطلوب ولا يمكن حذفه');
      }

      const trimmedPhone = dto.phone.trim();
      const lenientNew = normalizePhone(trimmedPhone);

      // Check if unchanged: bypass strict country allowlist & keep stored value intact
      const isUnchanged = Boolean(
        user.phone &&
          ((lenientNew !== null &&
            (lenientNew === user.phone || lenientNew === normalizePhone(user.phone))) ||
            trimmedPhone === user.phone),
      );

      if (!isUnchanged) {
        const strict = normalizePhoneStrict(trimmedPhone);
        if (!strict) {
          throw new BadRequestException('رقم الهاتف غير صالح أو غير مدعوم في دولتك');
        }
        nextPhone = strict.e164;
        isPhoneChanged = true;
      }
    }

    // Step-up authentication on phone change if user is currently verified and has password
    if (isPhoneChanged) {
      const isVerifiedCurrently = Boolean(user.phoneVerifiedAt && user.phoneE164);
      const passwordHash = user.passwordHash;

      if (isVerifiedCurrently) {
        const methods = getLoginMethods(user);
        const remainingMethods =
          Number(methods.hasPassword) +
          Number(methods.hasGoogle) +
          Number(methods.hasApple);

        if (remainingMethods === 0) {
          throw new BadRequestException({
            code: 'LAST_LOGIN_METHOD',
            message:
              'لا يمكن إزالة وسيلة الدخول الأخيرة لحسابك. يرجى إضافة وسيلة دخول أخرى أولا.',
          });
        }
      }

      if (isVerifiedCurrently && passwordHash) {
        if (!dto.currentPassword || typeof dto.currentPassword !== 'string') {
          throw new HttpException(
            {
              statusCode: 403,
              code: 'STEP_UP_REQUIRED',
              message: 'لتغيير رقم الهاتف الموثق، يرجى إدخال كلمة المرور الحالية',
            },
            HttpStatus.FORBIDDEN,
          );
        }

        const isPasswordValid = await bcrypt.compare(
          dto.currentPassword,
          passwordHash,
        );
        if (!isPasswordValid) {
          throw new HttpException(
            {
              statusCode: 403,
              code: 'STEP_UP_REQUIRED',
              message: 'كلمة المرور الحالية غير صحيحة لتأكيد تغيير رقم الهاتف',
            },
            HttpStatus.FORBIDDEN,
          );
        }
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
        ...(nextPhone !== undefined && { phone: nextPhone }),
        ...(isPhoneChanged && {
          phoneVerifiedAt: null,
          phoneE164: null,
        }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.governorateId !== undefined && { governorateId: dto.governorateId }),
        ...(dto.wilayaId !== undefined && { wilayaId: dto.wilayaId }),
        ...(nextAvatarUrl !== undefined && { avatarUrl: nextAvatarUrl }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      },
      select: {
        ...USER_SELECT_PROFILE_PRIVATE,
        phoneVerifiedAt: true,
        phoneE164: true,
      },
    });

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      if (dto.latitude && dto.longitude) {
        await this.geoService.syncLocation('users', userId, dto.latitude, dto.longitude);
      } else if (dto.latitude === null || dto.longitude === null) {
        await this.geoService.clearLocation('users', userId);
      }
    }

    const { phoneVerifiedAt, phoneE164, ...profile } = updated;
    const phoneVerified = Boolean(phoneVerifiedAt && phoneE164);

    return { ...profile, phoneVerified };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (!user.passwordHash) {
      if (user.appleSub) {
        throw new BadRequestException('هذا الحساب مسجل بواسطة Apple ولا يحتوي على كلمة مرور.');
      }
      if (user.googleId) {
        throw new BadRequestException('هذا الحساب مسجل بواسطة Google ولا يحتوي على كلمة مرور.');
      }
      throw new BadRequestException('هذا الحساب مسجل بواسطة رقم الهاتف ولا يحتوي على كلمة مرور.');
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

    const changedAt = new Date();
    if (updatedUser.email) {
      this.mailService
        .sendPasswordChangedEmail(updatedUser.email, changedAt, updatedUser.displayName)
        .catch((err: any) => {
          this.logger.error(
            `Failed to send password changed email for user ${userId}: ${redactEmails(err?.message || String(err))}`,
          );
        });
    }

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

  async scheduleAccountDeletion(userId: string, dto: DeleteAccountDto) {
    // 1. Fetch user for re-authentication and initial checks
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
        googleId: true,
        role: true,
        status: true,
        deletionScheduledAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // 2. Re-authentication rule (applied even on duplicate requests)
    const reauthMethod = getDeletionReauthMethod(user);
    if (reauthMethod === 'password') {
      if (!dto.password) {
        throw new UnauthorizedException('كلمة المرور مطلوبة لتأكيد حذف الحساب');
      }
      const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash!);
      if (!isPasswordValid) {
        throw new UnauthorizedException('كلمة المرور غير صحيحة');
      }
    } else if (reauthMethod === 'google') {
      if (!dto.googleIdToken) {
        throw new UnauthorizedException('رمز Google مطلوب لتأكيد حذف الحساب');
      }
      let payload: any;
      try {
        payload = await this.authService.verifyGoogleIdToken(dto.googleIdToken);
      } catch (err: any) {
        throw new UnauthorizedException(err?.message || 'رمز Google غير صالح');
      }
      if (payload.sub !== user.googleId) {
        throw new UnauthorizedException('حساب Google غير مطابق لحسابك المسجل');
      }
    }
    // Else: confirmation phrase is sufficient (validated by class-validator)

    // 3. Atomic transaction with extended timeout options
    const result = await this.prisma.$transaction(
      async (tx) => {
        // Fetch current user state inside transaction to prevent concurrency races
        const txUser = await tx.user.findUnique({
          where: { id: userId },
          select: {
            role: true,
            status: true,
            deletionScheduledAt: true,
          },
        });

        if (!txUser) {
          throw new NotFoundException('المستخدم غير موجود');
        }

        // (a) Role check: ADMIN and MODERATOR rejected
        if (txUser.role === 'ADMIN' || txUser.role === 'MODERATOR') {
          throw new ForbiddenException('لا يمكن حذف حساب إداري عبر هذا المسار');
        }

        // (b) Status check: BANNED and SUSPENDED rejected
        if (txUser.status === 'BANNED' || txUser.status === 'SUSPENDED') {
          throw new ForbiddenException('لا يمكن حذف حساب موقوف أو محظور');
        }

        // (c) Payments check: PENDING or PROCESSING rejected
        const activePayment = await tx.payment.findFirst({
          where: {
            userId,
            status: { in: ['PENDING', 'PROCESSING'] },
          },
        });
        if (activePayment) {
          throw new ConflictException(
            'لا يمكن جدولة حذف الحساب أثناء وجود معاملة دفع قيد المعالجة. يرجى الانتظار حتى اكتمال الدفعة أو إلغائها.',
          );
        }

        // (d) Compare-and-Set: updateMany with condition id and deletionScheduledAt: null
        const scheduledDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

        const updateResult = await tx.user.updateMany({
          where: {
            id: userId,
            deletionScheduledAt: null,
          },
          data: {
            deletionScheduledAt: scheduledDate,
            tokenVersion: { increment: 1 },
          },
        });

        // If count is 0, another request won the race or account was already scheduled
        if (updateResult.count === 0) {
          const existingScheduled = txUser.deletionScheduledAt ?? (
            await tx.user.findUnique({
              where: { id: userId },
              select: { deletionScheduledAt: true },
            })
          )?.deletionScheduledAt ?? scheduledDate;

          return {
            isExisting: true,
            deletionScheduledAt: existingScheduled,
          };
        }

        // (e) Revoke all refresh tokens in database
        await this.authTokenService.revokeAllRefreshTokens(userId, tx);

        // (f) Set autoRenew = false on active subscriptions
        await tx.subscription.updateMany({
          where: { userId, status: 'ACTIVE' },
          data: { autoRenew: false },
        });

        return {
          isExisting: false,
          deletionScheduledAt: scheduledDate,
        };
      },
      { maxWait: 15000, timeout: 20000 },
    );

    // 4. Post-commit hooks (only executed when initially scheduled)
    if (!result.isExisting) {
      // (a) Invalidate token cache
      await this.accessTokenGate.invalidate(userId);

      // (b) Hide all content with 2 retries (total 3 attempts) and 200ms delay between attempts
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await this.visibilityService.hideAllForUser(userId);
          break;
        } catch (err: any) {
          this.logger.error(
            `Attempt ${attempt} to hide content for user ${userId} failed: ${err.message}`,
          );
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }
      }

      // (c) Post-hiding audit count across the 11 entities in OWNER_VISIBILITY_REGISTRY
      let unhiddenCount = 0;
      for (const config of OWNER_VISIBILITY_REGISTRY) {
        const delegate = (this.prisma as any)[config.prismaDelegate];
        if (delegate && typeof delegate.count === 'function') {
          const count = await delegate.count({
            where: {
              hiddenByOwnerStatus: false,
              [config.ownerField]: userId,
            },
          });
          unhiddenCount += count;
        }
      }
      if (unhiddenCount > 0) {
        this.logger.warn(
          `User ${userId} scheduled for deletion has ${unhiddenCount} unhidden records across verticals. Background reconciliation cron will retry.`,
        );
      }

      // (d) Fail-safe email send
      if (user.email) {
        this.mailService
          .sendDeletionRequestEmail(user.email, result.deletionScheduledAt, user.displayName)
          .catch((err: any) => {
            this.logger.error(
              `Failed to send deletion request email for user ${userId}: ${err.message}`,
            );
          });
      }
    }

    return {
      success: true,
      deletionScheduledAt: result.deletionScheduledAt.toISOString(),
      message: result.isExisting
        ? 'حسابك مجدول للحذف بالفعل'
        : 'تمت جدولة حذف الحساب بنجاح',
    };
  }

  async cancelAccountDeletion(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        deletionScheduledAt: true,
      },
    });

    if (!user || user.deletionScheduledAt == null) {
      throw new BadRequestException('الحساب غير مجدول للحذف');
    }

    // 1. Reset deletionScheduledAt first in DB
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletionScheduledAt: null },
    });

    // 2. Restore all content for user (catch error so failure doesn't throw 500; cron will reconcile)
    try {
      await this.visibilityService.restoreAllForUser(userId);
    } catch (err: any) {
      this.logger.error(
        `Failed to restore content during cancelAccountDeletion for user ${userId}: ${err.message}`,
        err.stack,
      );
    }

    // 3. Send cancellation email (fail-safe)
    if (user.email) {
      this.mailService
        .sendDeletionCancelledEmail(user.email, user.displayName)
        .catch((err: any) => {
          this.logger.error(
            `Failed to send deletion cancelled email for user ${userId}: ${err.message}`,
          );
        });
    }

    return {
      success: true,
      message: 'تم إلغاء طلب حذف الحساب واستعادة إعلاناتك بنجاح',
    };
  }
}
