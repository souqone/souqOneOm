import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { OtpPurpose, AuthProvider, AccountStatus } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { MailService } from '../mail/mail.service';
import { AuthTokenService } from './auth-token.service';
import { AuthAuditService } from './auth-audit.service';
import { OtpService } from './otp.service';
import { AccessTokenGate } from './access-token-gate.service';
import { AccountStatusService } from './account-status.service';
import { BanBlacklistService } from '../ban-blacklist/ban-blacklist.service';
import { OTP_TTL_SECONDS } from './auth.constants';
import { isValidNormalizedEmail, normalizeEmail } from './auth.validators';
import { normalizePhoneStrict } from '../common/utils/normalize-phone';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.GOOGLE_IOS_CLIENT_ID || '';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly tokens: AuthTokenService,
    private readonly audit: AuthAuditService,
    private readonly otp: OtpService,
    private readonly accessTokenGate: AccessTokenGate,
    private readonly accountStatusService: AccountStatusService,
    private readonly banBlacklistService: BanBlacklistService,
  ) {
    this.googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
  }

  async signup(dto: SignupDto) {
    const email = normalizeEmail(dto.email);
    if (!isValidNormalizedEmail(email)) {
      throw new BadRequestException('البريد الإلكتروني غير صالح');
    }
    const username = dto.username.trim().toLowerCase();

    let normalizedPhone: string | undefined = undefined;
    if (dto.phone !== undefined && dto.phone !== null && dto.phone.trim() !== '') {
      const strict = normalizePhoneStrict(dto.phone);
      if (!strict) {
        throw new BadRequestException('رقم الهاتف غير صالح أو غير مدعوم في دولتك');
      }
      normalizedPhone = strict.e164;
    }

    const existingUserByUsername = await this.prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });
    if (existingUserByUsername) {
      throw new BadRequestException('اسم المستخدم مستخدم بالفعل');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          email, username, displayName: dto.displayName, passwordHash, phone: normalizedPhone,
          country: dto.country,
          governorate: dto.governorate,
          city: dto.city,
        },
      });

      const code = await this.otp.issue(user.id, OtpPurpose.EMAIL_VERIFY, OTP_TTL_SECONDS);

      let emailSent = true;
      try {
        await this.mailService.sendVerificationEmail(email, code);
      } catch {
        emailSent = false;
        this.logger.error(`Failed to send verification email for user ${user.id}`);
      }

      const verificationToken = await this.tokens.signVerificationToken(user.id);

      return {
        requiresVerification: true,
        verificationToken,
        emailSent,
        user: { email: user.email },
      };
    } catch (err: any) {
      if (err.code === 'P2002') {
        const field = err.meta?.target?.includes('email') ? 'البريد الإلكتروني' : 'اسم المستخدم';
        throw new BadRequestException(`${field} مستخدم بالفعل`);
      }
      throw err;
    }
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const email = normalizeEmail(dto.email);

    // Brute-force lockout check
    const lockout = await this.audit.checkLockout(email);
    if (lockout.locked) {
      await this.audit.logAudit({ email, success: false, reason: 'ACCOUNT_LOCKED', ip, userAgent });
      throw new UnauthorizedException(
        `تم قفل الحساب مؤقتاً بسبب محاولات فاشلة متعددة. حاول مرة أخرى بعد ${lockout.ttlMinutes} دقيقة.`,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      await this.audit.recordFailedAttempt(email);
      await this.audit.logAudit({ email, success: false, reason: 'USER_NOT_FOUND', ip, userAgent });
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    if (!user.passwordHash) {
      await this.audit.logAudit({ email, userId: user.id, success: false, reason: 'GOOGLE_ONLY', ip, userAgent });
      throw new UnauthorizedException('هذا الحساب مسجل بواسطة Google. استخدم تسجيل الدخول بـ Google.');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      await this.audit.recordFailedAttempt(email);
      await this.audit.logAudit({ email, userId: user.id, success: false, reason: 'WRONG_PASSWORD', ip, userAgent });
      throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    }

    try {
      await this.accountStatusService.assertCanAuthenticate(user);
    } catch (err: any) {
      if (err instanceof ForbiddenException) {
        const res = err.getResponse() as any;
        const reason = res?.code === 'ACCOUNT_BANNED' ? 'ACCOUNT_BANNED' : 'ACCOUNT_SUSPENDED';
        await this.audit.logAudit({ email, userId: user.id, success: false, reason, ip, userAgent });
      }
      throw err;
    }

    // Check if user is verified before issuing session tokens
    if (!user.isVerified) {
      await this.audit.resetLockout(email);
      await this.audit.logAudit({ email, userId: user.id, success: false, reason: 'EMAIL_NOT_VERIFIED', ip, userAgent });

      const code = await this.otp.issue(user.id, OtpPurpose.EMAIL_VERIFY, OTP_TTL_SECONDS);

      let emailSent = true;
      try {
        await this.mailService.sendVerificationEmail(email, code);
      } catch {
        emailSent = false;
        this.logger.error(`Failed to send verification email on login for user ${user.id}`);
      }

      const verificationToken = await this.tokens.signVerificationToken(user.id);

      return {
        requiresVerification: true,
        verificationToken,
        emailSent,
        user: { email: user.email },
      };
    }

    // Reset lockout on success
    await this.audit.resetLockout(email);
    await this.audit.logAudit({ email, userId: user.id, success: true, ip, userAgent });

    const accessToken = await this.tokens.signAccessToken(user);
    const refreshToken = await this.tokens.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user: this.tokens.sanitizeUser(user) };
  }

  async refresh(token: string) {
    const result = await this.tokens.rotateRefreshToken(token);
    if (!result) {
      throw new UnauthorizedException('رمز التجديد غير صالح أو منتهي');
    }
    return result;
  }

  async googleAuth(dto: GoogleAuthDto, ip?: string, userAgent?: string) {
    let payload;
    const audiences = [GOOGLE_CLIENT_ID, GOOGLE_IOS_CLIENT_ID].filter(Boolean);
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.credential,
        audience: audiences.length > 0 ? (audiences.length === 1 ? audiences[0] : audiences) : GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('رمز Google غير صالح');
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedException('لم يتم العثور على بريد إلكتروني في حساب Google');
    }

    if (payload.email_verified !== true) {
      throw new UnauthorizedException('البريد الإلكتروني لحساب Google غير موثق');
    }

    // Nonce validation for CSRF protection
    if (dto.nonce && payload.nonce !== dto.nonce) {
      throw new UnauthorizedException('رمز التحقق (nonce) غير متطابق — محاولة غير آمنة');
    }

    const { email, sub: googleId, name, picture } = payload;
    const hd = (payload as any).hd;
    const normalizedEmail = normalizeEmail(email);
    const isGoogleAuthoritative =
      normalizedEmail.endsWith('@gmail.com') || Boolean(hd && String(hd).trim().length > 0);

    // Check if user exists by googleId
    let user = await this.prisma.user.findUnique({ where: { googleId } });

    if (!user || user.googleId !== googleId) {
      const isBlocked = await this.banBlacklistService.isGoogleBlocked(googleId);
      if (isBlocked) {
        await this.audit.logAudit({
          email: normalizedEmail,
          userId: user?.id,
          success: false,
          reason: 'ACCOUNT_BANNED',
          method: 'GOOGLE',
          ip,
          userAgent,
        });
        throw new ForbiddenException({
          statusCode: 403,
          code: 'ACCOUNT_BANNED',
          message: 'تم حظر حسابك لمخالفة شروط الاستخدام',
        });
      }
    }

    if (user) {
      if (
        !user.isVerified &&
        isGoogleAuthoritative &&
        normalizeEmail(user.email) === normalizedEmail &&
        (user.status ?? 'ACTIVE') === 'ACTIVE'
      ) {
        const targetUserId = user.id;
        user = await this.prisma.$transaction(async (tx) => {
          const res = await tx.user.updateMany({
            where: {
              id: targetUserId,
              isVerified: false,
              status: { not: AccountStatus.BANNED },
            },
            data: {
              isVerified: true,
              emailVerifiedAt: new Date(),
            },
          });
          if (res.count === 0) {
            const fresh = await tx.user.findUnique({
              where: { id: targetUserId },
              select: { status: true },
            });
            if (fresh?.status === AccountStatus.BANNED) {
              throw new ForbiddenException({
                statusCode: 403,
                code: 'ACCOUNT_BANNED',
                message: 'تم حظر حسابك لمخالفة شروط الاستخدام',
              });
            }
          }
          if (res.count > 0) {
            await this.otp.invalidateActive(targetUserId, OtpPurpose.EMAIL_VERIFY, tx);
          }
          return tx.user.findUnique({ where: { id: targetUserId } });
        });
      }
    } else {
      // Check if user exists by email
      user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

      if (!user) {
        // Create new user from Google with dual-write to auth_identities
        const username = normalizedEmail.split('@')[0] + '_' + crypto.randomBytes(3).toString('hex');
        user = await this.prisma.$transaction(async (tx) => {
          const u = await tx.user.create({
            data: {
              email: normalizedEmail,
              username,
              displayName: name || username,
              googleId,
              avatarUrl: picture,
              isVerified: true,
              emailVerifiedAt: new Date(),
            },
          });
          if (tx.authIdentity?.upsert) {
            await tx.authIdentity.upsert({
              where: {
                provider_providerUserId: {
                  provider: AuthProvider.GOOGLE,
                  providerUserId: googleId,
                },
              },
              update: { userId: u.id },
              create: {
                userId: u.id,
                provider: AuthProvider.GOOGLE,
                providerUserId: googleId,
              },
            });
          }
          return u;
        });
      } else {
        // User exists with this email
        if (!isGoogleAuthoritative) {
          throw new ConflictException({
            statusCode: 409,
            code: 'ACCOUNT_LINK_REQUIRED',
            message: 'هذا البريد مسجل بالفعل. يرجى تسجيل الدخول بكلمة المرور لربط حساب Google.',
          });
        }

        if (!user.isVerified) {
          // Pre-hijacking mitigation: unverified account + authoritative Google + dual-write
          const targetUserId = user.id;
          const targetAvatarUrl = user.avatarUrl;
          user = await this.prisma.$transaction(async (tx) => {
            const res = await tx.user.updateMany({
              where: {
                id: targetUserId,
                status: { not: AccountStatus.BANNED },
              },
              data: {
                passwordHash: null,
                googleId,
                isVerified: true,
                emailVerifiedAt: new Date(),
                avatarUrl: targetAvatarUrl || picture,
              },
            });
            if (res.count === 0) {
              throw new ForbiddenException({
                statusCode: 403,
                code: 'ACCOUNT_BANNED',
                message: 'تم حظر حسابك لمخالفة شروط الاستخدام',
              });
            }
            if (tx.authIdentity?.upsert) {
              await tx.authIdentity.upsert({
                where: {
                  provider_providerUserId: {
                    provider: AuthProvider.GOOGLE,
                    providerUserId: googleId,
                  },
                },
                update: { userId: targetUserId },
                create: {
                  userId: targetUserId,
                  provider: AuthProvider.GOOGLE,
                  providerUserId: googleId,
                },
              });
            }
            await this.otp.invalidateActive(targetUserId, OtpPurpose.EMAIL_VERIFY, tx);
            await this.otp.invalidateActive(targetUserId, OtpPurpose.PASSWORD_RESET, tx);
            await this.tokens.revokeAllRefreshTokens(targetUserId, tx);
            return tx.user.findUniqueOrThrow({ where: { id: targetUserId } });
          });
        } else if (user.passwordHash) {
          // Verified user with existing password
          throw new ConflictException({
            statusCode: 409,
            code: 'ACCOUNT_LINK_REQUIRED',
            message: 'هذا الحساب مسجل بالفعل بكلمة مرور. يرجى تسجيل الدخول بكلمة المرور لربط حساب Google.',
          });
        } else {
          // Verified user with no password (require explicit linking, no silent link)
          if (user.googleId && user.googleId !== googleId) {
            throw new ConflictException({
              statusCode: 409,
              code: 'ACCOUNT_LINK_REQUIRED',
              message: 'هذا الحساب مرتبط بحساب Google آخر.',
            });
          }

          if (!user.googleId) {
            throw new ConflictException({
              statusCode: 409,
              code: 'ACCOUNT_LINK_REQUIRED',
              message: 'هذا البريد مسجل بالفعل. يرجى ربط حساب Google من إعدادات الحساب.',
            });
          }
        }
      }
    }

    if (!user) {
      throw new UnauthorizedException('فشل تسجيل الدخول بواسطة Google');
    }

    await this.accountStatusService.assertCanAuthenticate(user);

    await this.audit.logAudit({ email: normalizedEmail, userId: user.id, success: true, method: 'GOOGLE', ip, userAgent });

    const accessToken = await this.tokens.signAccessToken(user);
    const refreshToken = await this.tokens.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user: this.tokens.sanitizeUser(user) };
  }

  async verifyEmail(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('المستخدم غير موجود');

    if (user.isVerified) {
      return {
        message: 'البريد موثق بالفعل. يرجى تسجيل الدخول.',
        alreadyVerified: true,
      };
    }

    const verifyResult = await this.otp.verify(userId, OtpPurpose.EMAIL_VERIFY, code);
    if (verifyResult === 'MISSING_OR_EXPIRED') {
      throw new BadRequestException('لا يوجد رمز تحقق مرسل. اطلب رمز جديد.');
    }
    if (verifyResult === 'TOO_MANY_ATTEMPTS') {
      throw new BadRequestException('تم تجاوز عدد المحاولات. اطلب رمزاً جديداً.');
    }
    if (verifyResult === 'INVALID') {
      throw new BadRequestException('رمز التحقق غير صحيح');
    }

    await this.accountStatusService.assertCanAuthenticate(user);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, emailVerifiedAt: new Date() },
    });

    const accessToken = await this.tokens.signAccessToken(updated);
    const refreshToken = await this.tokens.generateRefreshToken(updated.id);

    return {
      accessToken,
      refreshToken,
      user: this.tokens.sanitizeUser(updated),
    };
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('المستخدم غير موجود');
    if (user.isVerified) return { message: 'البريد موثق بالفعل' };
    if (!user.email) {
      return { message: 'تم إرسال رمز تحقق جديد', emailSent: false };
    }

    const code = await this.otp.issue(user.id, OtpPurpose.EMAIL_VERIFY, OTP_TTL_SECONDS);

    let emailSent = true;
    try {
      await this.mailService.sendVerificationEmail(user.email, code);
    } catch {
      emailSent = false;
      this.logger.error(`Failed to send verification email on resend for user ${userId}`);
    }

    return { message: 'تم إرسال رمز تحقق جديد', emailSent };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
    if (!user || !user.email) return { message: 'إذا كان البريد مسجلاً ستصلك رسالة' };

    const code = await this.otp.issue(user.id, OtpPurpose.PASSWORD_RESET, OTP_TTL_SECONDS);

    try {
      await this.mailService.sendPasswordResetEmail(user.email, code);
    } catch (err) {
      this.logger.error(
        `Failed to send password reset email for user ${user.id}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
    return { message: 'إذا كان البريد مسجلاً ستصلك رسالة' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
    if (!user) {
      throw new BadRequestException('رمز إعادة التعيين منتهي. اطلب رمزاً جديداً.');
    }

    const verifyResult = await this.otp.verify(user.id, OtpPurpose.PASSWORD_RESET, code);
    if (verifyResult === 'MISSING_OR_EXPIRED') {
      throw new BadRequestException('رمز إعادة التعيين منتهي. اطلب رمزاً جديداً.');
    }
    if (verifyResult === 'TOO_MANY_ATTEMPTS') {
      throw new BadRequestException('تم تجاوز عدد المحاولات. اطلب رمزاً جديداً.');
    }
    if (verifyResult === 'INVALID') {
      throw new BadRequestException('رمز إعادة التعيين غير صحيح');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          tokenVersion: { increment: 1 },
        },
      });
      await this.tokens.revokeAllRefreshTokens(user.id, tx);
    });

    await this.accessTokenGate.invalidate(user.id);

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  async logout(token: string) {
    await this.tokens.revokeRefreshToken(token);
    return { message: 'تم تسجيل الخروج بنجاح' };
  }
}
