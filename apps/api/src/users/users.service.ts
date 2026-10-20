import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
  Logger,
  Optional,
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
import {
  getDeletionReauthMethod,
  getAvailableDeletionReauthMethods,
} from './deletion-reauth-method.util';
import { AppleTokenVerifierService } from '../auth/apple-token-verifier.service';
import { AppleRevocationService } from '../auth/apple-revocation.service';
import { AuthProvider } from '@prisma/client';
import { BanBlacklistService } from '../ban-blacklist/ban-blacklist.service';
import { AuthAuditService } from '../auth/auth-audit.service';
import { LinkGoogleDto } from './dto/link-google.dto';
import { LinkAppleDto } from './dto/link-apple.dto';

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
    @Optional()
    private readonly appleTokenVerifier?: AppleTokenVerifierService,
    @Optional()
    private readonly appleRevocationService?: AppleRevocationService,
    @Optional()
    private readonly banBlacklistService?: BanBlacklistService,
    @Optional()
    private readonly authAuditService?: AuthAuditService,
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
        appleSub: true,
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const { phoneVerifiedAt, phoneE164, passwordHash, googleId, appleSub, ...profile } = user;
    const phoneVerified = Boolean(phoneVerifiedAt && phoneE164);
    const deletionReauthMethod = getDeletionReauthMethod({ passwordHash, googleId, appleSub });
    const availableDeletionReauthMethods = getAvailableDeletionReauthMethods({
      passwordHash,
      googleId,
      appleSub,
    });

    return { ...profile, phoneVerified, deletionReauthMethod, availableDeletionReauthMethods };
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
        appleSub: true,
        role: true,
        status: true,
        deletionScheduledAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // Pre-checks BEFORE any call to Apple (read-only outside transaction)
    if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
      throw new ForbiddenException('لا يمكن حذف حساب إداري عبر هذا المسار');
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      throw new ForbiddenException('لا يمكن حذف حساب موقوف أو محظور');
    }

    const preCheckPayment = await this.prisma.payment.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });
    if (preCheckPayment) {
      throw new ConflictException(
        'لا يمكن جدولة حذف الحساب أثناء وجود معاملة دفع قيد المعالجة. يرجى الانتظار حتى اكتمال الدفعة أو إلغائها.',
      );
    }

    // 2. Validate Apple fields consistency: all three or none
    const appleFields = [dto.appleIdentityToken, dto.appleNonce, dto.appleAuthorizationCode];
    const providedAppleCount = appleFields.filter((f) => typeof f === 'string' && f.trim() !== '').length;
    if (providedAppleCount > 0 && providedAppleCount < 3) {
      throw new BadRequestException(
        'يلزم إرسال جميع بيانات Apple معاً (رمز الهوية، رمز التحقق، ورمز التفويض)',
      );
    }

    // 3. Method selection:
    // If request has Apple fields AND user has appleSub -> Apple path
    // Otherwise normal path. If user is Apple-only -> must use Apple.
    // If account has no appleSub and sent Apple fields -> ignore Apple fields and proceed with normal path.
    const hasCompleteAppleFields = providedAppleCount === 3;
    const useAppleReauth = Boolean(hasCompleteAppleFields && user.appleSub);

    if (useAppleReauth) {
      if (!this.appleTokenVerifier || !this.appleRevocationService) {
        throw new ServiceUnavailableException({
          statusCode: 503,
          code: 'APPLE_REVOCATION_UNAVAILABLE',
          message: 'خدمة التحقق من Apple غير متوفرة حالياً، يرجى المحاولة لاحقاً',
        });
      }

      let payload: any;
      try {
        payload = await this.appleTokenVerifier.verifyIdToken(
          dto.appleIdentityToken!,
          dto.appleNonce!,
        );
      } catch (err: any) {
        if (err instanceof ServiceUnavailableException) {
          throw new ServiceUnavailableException({
            statusCode: 503,
            code: 'APPLE_SERVICE_ERROR',
            message: 'تعذّر تأكيد الإلغاء مع Apple، يرجى المحاولة بعد قليل',
          });
        }
        throw new UnauthorizedException({
          statusCode: 401,
          code: 'APPLE_TOKEN_INVALID',
          message: 'تعذّر التحقق من هويتك عبر Apple، يرجى المحاولة مرة أخرى',
        });
      }

      if (payload.sub !== user.appleSub) {
        throw new UnauthorizedException({
          statusCode: 401,
          code: 'APPLE_SUB_MISMATCH',
          message: 'حساب Apple المستخدم لا يطابق الحساب المسجل في سوق ون',
        });
      }

      // Check duplicate request after identity verification
      if (user.deletionScheduledAt != null) {
        return {
          success: true,
          deletionScheduledAt: user.deletionScheduledAt.toISOString(),
          message: 'حسابك مجدول للحذف بالفعل',
        };
      }

      try {
        await this.appleRevocationService.exchangeAndRevoke(
          dto.appleAuthorizationCode!,
          user.appleSub!,
        );
      } catch (err: any) {
        if (
          err instanceof BadRequestException &&
          err.getResponse &&
          (err.getResponse() as any)?.code === 'APPLE_CODE_INVALID'
        ) {
          const freshUser = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { deletionScheduledAt: true },
          });
          if (freshUser?.deletionScheduledAt != null) {
            return {
              success: true,
              deletionScheduledAt: freshUser.deletionScheduledAt.toISOString(),
              message: 'حسابك مجدول للحذف بالفعل',
            };
          }
        }
        throw err;
      }
    } else {
      // User did not use Apple reauth
      if (!user.passwordHash && !user.googleId && user.appleSub) {
        throw new UnauthorizedException({
          statusCode: 401,
          code: 'APPLE_REAUTH_REQUIRED',
          message: 'يلزم إعادة تأكيد هويتك عبر Apple لتأكيد حذف الحساب',
        });
      }

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
    }

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

  private async logSecurityAudit(data: {
    email: string;
    userId?: string;
    success: boolean;
    method?: string;
    reason?: string;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    if (this.authAuditService) {
      await this.authAuditService.logAudit(data);
    } else {
      try {
        await this.prisma.loginAudit.create({
          data: {
            email: data.email,
            userId: data.userId,
            success: data.success,
            method: data.method || 'EMAIL',
            ipAddress: data.ip,
            userAgent: data.userAgent,
            reason: data.reason,
          },
        });
      } catch (err) {
        this.logger.error('Failed to write login audit', err);
      }
    }
  }

  private async verifyStepUp(
    user: {
      id: string;
      passwordHash?: string | null;
      googleId?: string | null;
      appleSub?: string | null;
    },
    dto: {
      currentPassword?: string;
      reauthGoogleIdToken?: string;
      reauthAppleIdToken?: string;
      reauthAppleNonce?: string;
    },
    action: 'link' | 'unlink',
    provider: 'google' | 'apple',
  ): Promise<void> {
    const actionAr = action === 'link' ? 'ربط' : 'إلغاء ربط';

    // 1. If user has a password set (regardless of email verification status)
    if (user.passwordHash) {
      if (!dto.currentPassword || typeof dto.currentPassword !== 'string' || !dto.currentPassword.trim()) {
        throw new HttpException(
          {
            statusCode: 403,
            code: 'STEP_UP_REQUIRED',
            message: `يرجى إدخال كلمة المرور الحالية لتأكيد ${actionAr} الحساب`,
          },
          HttpStatus.FORBIDDEN,
        );
      }
      const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new HttpException(
          {
            statusCode: 403,
            code: 'STEP_UP_REQUIRED',
            message: `كلمة المرور الحالية غير صحيحة لتأكيد ${actionAr} الحساب`,
          },
          HttpStatus.FORBIDDEN,
        );
      }
      return;
    }

    // 2. User has no password set:
    if (action === 'link') {
      // If linking Google and user already has Apple:
      if (provider === 'google' && user.appleSub) {
        if (!dto.reauthAppleIdToken || !dto.reauthAppleNonce) {
          throw new HttpException(
            {
              statusCode: 403,
              code: 'STEP_UP_REQUIRED',
              message: 'يلزم إعادة تأكيد هويتك عبر Apple لتأكيد ربط الحساب',
            },
            HttpStatus.FORBIDDEN,
          );
        }
        if (!this.appleTokenVerifier) {
          throw new ServiceUnavailableException({
            statusCode: 503,
            code: 'APPLE_SERVICE_ERROR',
            message: 'خدمة التحقق من Apple غير متوفرة حالياً، يرجى المحاولة لاحقاً',
          });
        }
        let payload: any;
        try {
          payload = await this.appleTokenVerifier.verifyIdToken(
            dto.reauthAppleIdToken,
            dto.reauthAppleNonce,
          );
        } catch (err: any) {
          if (err instanceof ServiceUnavailableException) {
            throw new ServiceUnavailableException({
              statusCode: 503,
              code: 'APPLE_SERVICE_ERROR',
              message: 'تعذّر تأكيد الرمز مع Apple، يرجى المحاولة بعد قليل',
            });
          }
          throw new UnauthorizedException({
            statusCode: 401,
            code: 'APPLE_TOKEN_INVALID',
            message: 'تعذّر التحقق من هويتك عبر Apple، يرجى المحاولة مرة أخرى',
          });
        }
        if (payload.sub !== user.appleSub) {
          throw new UnauthorizedException({
            statusCode: 401,
            code: 'APPLE_SUB_MISMATCH',
            message: 'حساب Apple المستخدم لا يطابق الحساب المسجل في سوق ون',
          });
        }
        return;
      }

      // If linking Apple and user already has Google:
      if (provider === 'apple' && user.googleId) {
        if (!dto.reauthGoogleIdToken) {
          throw new HttpException(
            {
              statusCode: 403,
              code: 'STEP_UP_REQUIRED',
              message: 'يلزم إعادة تأكيد هويتك عبر Google لتأكيد ربط الحساب',
            },
            HttpStatus.FORBIDDEN,
          );
        }
        let payload: any;
        try {
          payload = await this.authService.verifyGoogleIdToken(dto.reauthGoogleIdToken);
        } catch (err: any) {
          throw new UnauthorizedException(err?.message || 'رمز Google غير صالح');
        }
        if (payload.sub !== user.googleId) {
          throw new UnauthorizedException('حساب Google غير مطابق لحسابك المسجل');
        }
        return;
      }

      // If linking and user has neither password nor another social provider (e.g. phone-only):
      // Active JWT is sufficient.
      return;
    }

    if (action === 'unlink') {
      if (provider === 'google') {
        if (dto.reauthGoogleIdToken) {
          let payload: any;
          try {
            payload = await this.authService.verifyGoogleIdToken(dto.reauthGoogleIdToken);
          } catch (err: any) {
            throw new UnauthorizedException(err?.message || 'رمز Google غير صالح');
          }
          if (payload.sub !== user.googleId) {
            throw new UnauthorizedException('حساب Google غير مطابق لحسابك المسجل');
          }
          return;
        }

        if (user.appleSub && dto.reauthAppleIdToken && dto.reauthAppleNonce) {
          if (!this.appleTokenVerifier) {
            throw new ServiceUnavailableException({
              statusCode: 503,
              code: 'APPLE_SERVICE_ERROR',
              message: 'خدمة التحقق من Apple غير متوفرة حالياً، يرجى المحاولة لاحقاً',
            });
          }
          let payload: any;
          try {
            payload = await this.appleTokenVerifier.verifyIdToken(
              dto.reauthAppleIdToken,
              dto.reauthAppleNonce,
            );
          } catch (err: any) {
            if (err instanceof ServiceUnavailableException) {
              throw new ServiceUnavailableException({
                statusCode: 503,
                code: 'APPLE_SERVICE_ERROR',
                message: 'تعذّر تأكيد الرمز مع Apple، يرجى المحاولة بعد قليل',
              });
            }
            throw new UnauthorizedException({
              statusCode: 401,
              code: 'APPLE_TOKEN_INVALID',
              message: 'تعذّر التحقق من هويتك عبر Apple، يرجى المحاولة مرة أخرى',
            });
          }
          if (payload.sub !== user.appleSub) {
            throw new UnauthorizedException({
              statusCode: 401,
              code: 'APPLE_SUB_MISMATCH',
              message: 'حساب Apple المستخدم لا يطابق الحساب المسجل في سوق ون',
            });
          }
          return;
        }

        throw new HttpException(
          {
            statusCode: 403,
            code: 'STEP_UP_REQUIRED',
            message: user.appleSub
              ? 'يلزم إعادة تأكيد هويتك عبر Google أو Apple لتأكيد إلغاء ربط الحساب'
              : 'يلزم إعادة تأكيد هويتك عبر Google لتأكيد إلغاء ربط الحساب',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      if (provider === 'apple') {
        if (dto.reauthAppleIdToken && dto.reauthAppleNonce) {
          if (!this.appleTokenVerifier) {
            throw new ServiceUnavailableException({
              statusCode: 503,
              code: 'APPLE_SERVICE_ERROR',
              message: 'خدمة التحقق من Apple غير متوفرة حالياً، يرجى المحاولة لاحقاً',
            });
          }
          let payload: any;
          try {
            payload = await this.appleTokenVerifier.verifyIdToken(
              dto.reauthAppleIdToken,
              dto.reauthAppleNonce,
            );
          } catch (err: any) {
            if (err instanceof ServiceUnavailableException) {
              throw new ServiceUnavailableException({
                statusCode: 503,
                code: 'APPLE_SERVICE_ERROR',
                message: 'تعذّر تأكيد الرمز مع Apple، يرجى المحاولة بعد قليل',
              });
            }
            throw new UnauthorizedException({
              statusCode: 401,
              code: 'APPLE_TOKEN_INVALID',
              message: 'تعذّر التحقق من هويتك عبر Apple، يرجى المحاولة مرة أخرى',
            });
          }
          if (payload.sub !== user.appleSub) {
            throw new UnauthorizedException({
              statusCode: 401,
              code: 'APPLE_SUB_MISMATCH',
              message: 'حساب Apple المستخدم لا يطابق الحساب المسجل في سوق ون',
            });
          }
          return;
        }

        if (user.googleId && dto.reauthGoogleIdToken) {
          let payload: any;
          try {
            payload = await this.authService.verifyGoogleIdToken(dto.reauthGoogleIdToken);
          } catch (err: any) {
            throw new UnauthorizedException(err?.message || 'رمز Google غير صالح');
          }
          if (payload.sub !== user.googleId) {
            throw new UnauthorizedException('حساب Google غير مطابق لحسابك المسجل');
          }
          return;
        }

        throw new HttpException(
          {
            statusCode: 403,
            code: 'STEP_UP_REQUIRED',
            message: user.googleId
              ? 'يلزم إعادة تأكيد هويتك عبر Apple أو Google لتأكيد إلغاء ربط الحساب'
              : 'يلزم إعادة تأكيد هويتك عبر Apple لتأكيد إلغاء ربط الحساب',
          },
          HttpStatus.FORBIDDEN,
        );
      }
    }
  }

  async linkGoogle(
    userId: string,
    dto: LinkGoogleDto,
    ip?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
        googleId: true,
        appleSub: true,
        role: true,
        status: true,
        deletionScheduledAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ACCOUNT_BANNED',
        message: 'تم حظر حسابك لمخالفة شروط الاستخدام',
      });
    }

    if (user.deletionScheduledAt != null) {
      throw new ForbiddenException(
        'الحساب مجدول للحذف. يرجى إلغاء طلب الحذف أولاً لتعديل وسائل الدخول.',
      );
    }

    // Step-up verification
    await this.verifyStepUp(user, dto, 'link', 'google');

    // Verify Google ID token
    const payload = await this.authService.verifyGoogleIdToken(dto.credential, dto.nonce);
    const googleId = payload.sub;
    const googleEmail = payload.email;

    // Check ban blacklist
    if (this.banBlacklistService) {
      const isBlocked = await this.banBlacklistService.isGoogleBlocked(googleId);
      if (isBlocked) {
        await this.logSecurityAudit({
          email: user.email || googleEmail || 'unknown',
          userId: user.id,
          success: false,
          reason: 'ACCOUNT_BANNED',
          method: 'LINK_GOOGLE',
          ip,
          userAgent,
        });
        throw new ForbiddenException({
          statusCode: 403,
          code: 'ACCOUNT_BANNED',
          message: 'تم حظر هذا الحساب لمخالفة شروط الاستخدام',
        });
      }
    }

    // Idempotency: already linked to THIS user
    if (user.googleId === googleId) {
      return { message: 'تم ربط حساب Google بنجاح' };
    }

    // Check collision on User
    const existingUser = await this.prisma.user.findUnique({
      where: { googleId },
      select: { id: true },
    });
    if (existingUser && existingUser.id !== userId) {
      await this.logSecurityAudit({
        email: user.email || googleEmail || 'unknown',
        userId: user.id,
        success: false,
        reason: 'SOCIAL_ACCOUNT_ALREADY_LINKED',
        method: 'LINK_GOOGLE',
        ip,
        userAgent,
      });
      throw new ConflictException({
        statusCode: 409,
        code: 'SOCIAL_ACCOUNT_ALREADY_LINKED',
        message: 'حساب Google هذا مرتبط بحساب آخر بالفعل',
      });
    }

    // Check collision on AuthIdentity
    const existingIdentity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider: AuthProvider.GOOGLE,
          providerUserId: googleId,
        },
      },
      select: { userId: true },
    });
    if (existingIdentity && existingIdentity.userId !== userId) {
      await this.logSecurityAudit({
        email: user.email || googleEmail || 'unknown',
        userId: user.id,
        success: false,
        reason: 'SOCIAL_ACCOUNT_ALREADY_LINKED',
        method: 'LINK_GOOGLE',
        ip,
        userAgent,
      });
      throw new ConflictException({
        statusCode: 409,
        code: 'SOCIAL_ACCOUNT_ALREADY_LINKED',
        message: 'حساب Google هذا مرتبط بحساب آخر بالفعل',
      });
    }

    // Execute atomic dual-write transaction with P2002 race protection
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { googleId },
        });
        await tx.authIdentity.upsert({
          where: {
            provider_providerUserId: {
              provider: AuthProvider.GOOGLE,
              providerUserId: googleId,
            },
          },
          update: { userId },
          create: {
            userId,
            provider: AuthProvider.GOOGLE,
            providerUserId: googleId,
          },
        });
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const fresh = await this.prisma.user.findUnique({
          where: { googleId },
          select: { id: true },
        });
        if (fresh && fresh.id === userId) {
          return { message: 'تم ربط حساب Google بنجاح' };
        }
        await this.logSecurityAudit({
          email: user.email || googleEmail || 'unknown',
          userId: user.id,
          success: false,
          reason: 'SOCIAL_ACCOUNT_ALREADY_LINKED',
          method: 'LINK_GOOGLE',
          ip,
          userAgent,
        });
        throw new ConflictException({
          statusCode: 409,
          code: 'SOCIAL_ACCOUNT_ALREADY_LINKED',
          message: 'حساب Google هذا مرتبط بحساب آخر بالفعل',
        });
      }
      throw err;
    }

    // Audit log
    const targetEmail = user.email || googleEmail;
    await this.logSecurityAudit({
      email: targetEmail || 'unknown',
      userId: user.id,
      success: true,
      method: 'LINK_GOOGLE',
      ip,
      userAgent,
    });

    return { message: 'تم ربط حساب Google بنجاح' };
  }

  async linkApple(
    userId: string,
    dto: LinkAppleDto,
    ip?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        passwordHash: true,
        googleId: true,
        appleSub: true,
        role: true,
        status: true,
        deletionScheduledAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ACCOUNT_BANNED',
        message: 'تم حظر حسابك لمخالفة شروط الاستخدام',
      });
    }

    if (user.deletionScheduledAt != null) {
      throw new ForbiddenException(
        'الحساب مجدول للحذف. يرجى إلغاء طلب الحذف أولاً لتعديل وسائل الدخول.',
      );
    }

    // Step-up verification
    await this.verifyStepUp(user, dto, 'link', 'apple');

    // Verify Apple ID token
    if (!this.appleTokenVerifier) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        code: 'APPLE_SERVICE_ERROR',
        message: 'خدمة التحقق من Apple غير متوفرة حالياً، يرجى المحاولة لاحقاً',
      });
    }
    let payload: any;
    try {
      payload = await this.appleTokenVerifier.verifyIdToken(dto.identityToken, dto.nonce);
    } catch (err: any) {
      if (err instanceof ServiceUnavailableException) {
        throw new ServiceUnavailableException({
          statusCode: 503,
          code: 'APPLE_SERVICE_ERROR',
          message: 'تعذّر تأكيد الرمز مع Apple، يرجى المحاولة بعد قليل',
        });
      }
      throw new UnauthorizedException({
        statusCode: 401,
        code: 'APPLE_TOKEN_INVALID',
        message: 'تعذّر التحقق من هويتك عبر Apple، يرجى المحاولة مرة أخرى',
      });
    }

    const appleSub = payload.sub;
    const appleEmail = payload.email;

    // Check ban blacklist
    if (this.banBlacklistService) {
      const isBlocked = await this.banBlacklistService.isAppleBlocked(appleSub);
      if (isBlocked) {
        await this.logSecurityAudit({
          email: user.email || appleEmail || 'unknown',
          userId: user.id,
          success: false,
          reason: 'ACCOUNT_BANNED',
          method: 'LINK_APPLE',
          ip,
          userAgent,
        });
        throw new ForbiddenException({
          statusCode: 403,
          code: 'ACCOUNT_BANNED',
          message: 'تم حظر هذا الحساب لمخالفة شروط الاستخدام',
        });
      }
    }

    // Idempotency: already linked to THIS user
    if (user.appleSub === appleSub) {
      return { message: 'تم ربط حساب Apple بنجاح' };
    }

    // Check collision on User
    const existingUser = await this.prisma.user.findUnique({
      where: { appleSub },
      select: { id: true },
    });
    if (existingUser && existingUser.id !== userId) {
      await this.logSecurityAudit({
        email: user.email || appleEmail || 'unknown',
        userId: user.id,
        success: false,
        reason: 'SOCIAL_ACCOUNT_ALREADY_LINKED',
        method: 'LINK_APPLE',
        ip,
        userAgent,
      });
      throw new ConflictException({
        statusCode: 409,
        code: 'SOCIAL_ACCOUNT_ALREADY_LINKED',
        message: 'حساب Apple هذا مرتبط بحساب آخر بالفعل',
      });
    }

    // Check collision on AuthIdentity
    const existingIdentity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider: AuthProvider.APPLE,
          providerUserId: appleSub,
        },
      },
      select: { userId: true },
    });
    if (existingIdentity && existingIdentity.userId !== userId) {
      await this.logSecurityAudit({
        email: user.email || appleEmail || 'unknown',
        userId: user.id,
        success: false,
        reason: 'SOCIAL_ACCOUNT_ALREADY_LINKED',
        method: 'LINK_APPLE',
        ip,
        userAgent,
      });
      throw new ConflictException({
        statusCode: 409,
        code: 'SOCIAL_ACCOUNT_ALREADY_LINKED',
        message: 'حساب Apple هذا مرتبط بحساب آخر بالفعل',
      });
    }

    // Execute atomic dual-write transaction with P2002 race protection
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { appleSub },
        });
        await tx.authIdentity.upsert({
          where: {
            provider_providerUserId: {
              provider: AuthProvider.APPLE,
              providerUserId: appleSub,
            },
          },
          update: { userId },
          create: {
            userId,
            provider: AuthProvider.APPLE,
            providerUserId: appleSub,
          },
        });
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const fresh = await this.prisma.user.findUnique({
          where: { appleSub },
          select: { id: true },
        });
        if (fresh && fresh.id === userId) {
          return { message: 'تم ربط حساب Apple بنجاح' };
        }
        await this.logSecurityAudit({
          email: user.email || appleEmail || 'unknown',
          userId: user.id,
          success: false,
          reason: 'SOCIAL_ACCOUNT_ALREADY_LINKED',
          method: 'LINK_APPLE',
          ip,
          userAgent,
        });
        throw new ConflictException({
          statusCode: 409,
          code: 'SOCIAL_ACCOUNT_ALREADY_LINKED',
          message: 'حساب Apple هذا مرتبط بحساب آخر بالفعل',
        });
      }
      throw err;
    }

    // Audit log
    const targetEmail = user.email || appleEmail;
    await this.logSecurityAudit({
      email: targetEmail || 'unknown',
      userId: user.id,
      success: true,
      method: 'LINK_APPLE',
      ip,
      userAgent,
    });

    return { message: 'تم ربط حساب Apple بنجاح' };
  }
}
