import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { AccountStatus, OtpPurpose, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PhoneOtpService } from '../whatsapp/phone-otp.service';
import { AuthTokenService } from './auth-token.service';
import { AuthAuditService } from './auth-audit.service';
import { AccountStatusService } from './account-status.service';
import { BanBlacklistService } from '../ban-blacklist/ban-blacklist.service';
import {
  normalizePhoneStrict,
  getAllowedCountryCodes,
} from '../common/utils/normalize-phone';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

export interface PhoneAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
}

@Injectable()
export class PhoneAuthService {
  private readonly logger = new Logger(PhoneAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly phoneOtpService: PhoneOtpService,
    private readonly tokens: AuthTokenService,
    private readonly audit: AuthAuditService,
    private readonly accountStatusService: AccountStatusService,
    private readonly banBlacklistService: BanBlacklistService,
  ) {}

  /**
   * Requests a WhatsApp OTP for phone login or signup.
   * Always returns uniform { sent: true } to prevent account enumeration.
   * Rate limits and cooldown are enforced by PhoneOtpService & WhatsappLimitsService.
   */
  async requestOtp(dto: RequestOtpDto, ip?: string): Promise<{ sent: true }> {
    const strictResult = normalizePhoneStrict(dto.phone, {
      allowedCountryCodes: getAllowedCountryCodes(),
    });

    if (!strictResult) {
      throw new HttpException(
        {
          statusCode: 400,
          code: 'PHONE_COUNTRY_NOT_ALLOWED',
          message: 'رقم الهاتف غير صالح أو الدولة غير مدعومة حالياً',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.phoneOtpService.request({
      phoneE164: strictResult.e164,
      purpose: OtpPurpose.PHONE_LOGIN,
      ip,
    });

    return { sent: true };
  }

  /**
   * Verifies a WhatsApp OTP and signs the user in, or automatically registers
   * a new verified account (Signup v2) if none exists.
   */
  async verifyOtp(
    dto: VerifyOtpDto,
    ip?: string,
    userAgent?: string,
  ): Promise<PhoneAuthResponse> {
    const strictResult = normalizePhoneStrict(dto.phone, {
      allowedCountryCodes: getAllowedCountryCodes(),
    });

    if (!strictResult) {
      throw new HttpException(
        {
          statusCode: 400,
          code: 'PHONE_COUNTRY_NOT_ALLOWED',
          message: 'رقم الهاتف غير صالح أو الدولة غير مدعومة حالياً',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const phoneE164 = strictResult.e164;

    // Verify OTP code first
    await this.phoneOtpService.verify({
      phoneE164,
      purpose: OtpPurpose.PHONE_LOGIN,
      code: dto.code,
    });

    const maskedPhone = `phone:***${phoneE164.slice(-4)}`;

    // 1. Search for existing user by verified phone number
    const existingUser = await this.prisma.user.findUnique({
      where: { phoneE164 },
    });

    // 2. Existing user path: validate status and authenticate
    if (existingUser) {
      try {
        await this.accountStatusService.assertCanAuthenticate(existingUser);
      } catch (err: any) {
        if (err instanceof ForbiddenException) {
          const res = err.getResponse() as any;
          const reason =
            res?.code === 'ACCOUNT_BANNED'
              ? 'ACCOUNT_BANNED'
              : 'ACCOUNT_SUSPENDED';
          await this.audit.logAudit({
            email: maskedPhone,
            userId: existingUser.id,
            success: false,
            reason,
            method: 'PHONE',
            ip,
            userAgent,
          });
        }
        throw err;
      }

      await this.audit.logAudit({
        email: maskedPhone,
        userId: existingUser.id,
        success: true,
        method: 'PHONE',
        ip,
        userAgent,
      });

      const accessToken = await this.tokens.signAccessToken(existingUser);
      const refreshToken = await this.tokens.generateRefreshToken(
        existingUser.id,
      );

      return {
        accessToken,
        refreshToken,
        user: this.tokens.sanitizeUser(existingUser),
      };
    }

    // 3. New user path: check blacklist before signup
    const isBlocked = await this.banBlacklistService.isPhoneBlocked(phoneE164);
    if (isBlocked) {
      await this.audit.logAudit({
        email: maskedPhone,
        success: false,
        reason: 'PHONE_NOT_ALLOWED',
        method: 'PHONE',
        ip,
        userAgent,
      });
      throw new ForbiddenException({
        statusCode: 403,
        code: 'PHONE_NOT_ALLOWED',
        message: 'رقم الهاتف غير مسموح به',
      });
    }

    // 4. Signup v2: create new user with auto username and displayName
    const displayName = `مستخدم ${phoneE164.slice(-4)}`;
    const MAX_USERNAME_RETRIES = 3;
    let createdUser: User | null = null;

    for (let attempt = 0; attempt < MAX_USERNAME_RETRIES; attempt++) {
      const randomHex = crypto.randomBytes(4).toString('hex'); // 8 hex chars lowercase
      const username = `user_${randomHex}`;

      try {
        createdUser = await this.prisma.$transaction(async (tx) => {
          const blockedInTx = await this.banBlacklistService.isPhoneBlocked(
            phoneE164,
          );
          if (blockedInTx) {
            throw new ForbiddenException({
              statusCode: 403,
              code: 'PHONE_NOT_ALLOWED',
              message: 'رقم الهاتف غير مسموح به',
            });
          }

          return tx.user.create({
            data: {
              username,
              displayName,
              phone: phoneE164,
              phoneE164,
              phoneVerifiedAt: new Date(),
              isVerified: true,
              status: AccountStatus.ACTIVE,
            },
          });
        });
        break; // Successfully created
      } catch (err: any) {
        if (err instanceof ForbiddenException) {
          throw err;
        }

        if (err?.code === 'P2002') {
          const target = err?.meta?.target;
          const isPhoneConflict = Array.isArray(target)
            ? target.includes('phoneE164') || target.includes('phone')
            : typeof target === 'string' &&
              (target.includes('phoneE164') || target.includes('phone'));

          if (isPhoneConflict) {
            // Concurrent request won the race: re-query winning user
            const winner = await this.prisma.user.findUnique({
              where: { phoneE164 },
            });
            if (winner) {
              await this.accountStatusService.assertCanAuthenticate(winner);
              await this.audit.logAudit({
                email: maskedPhone,
                userId: winner.id,
                success: true,
                method: 'PHONE',
                ip,
                userAgent,
              });
              const accessToken = await this.tokens.signAccessToken(winner);
              const refreshToken = await this.tokens.generateRefreshToken(
                winner.id,
              );
              return {
                accessToken,
                refreshToken,
                user: this.tokens.sanitizeUser(winner),
              };
            }
          }

          const isUsernameConflict = Array.isArray(target)
            ? target.includes('username')
            : typeof target === 'string' && target.includes('username');

          if (isUsernameConflict && attempt < MAX_USERNAME_RETRIES - 1) {
            this.logger.warn(
              `Username collision on ${username}, retrying with new random hex...`,
            );
            continue;
          }

          // If unknown target or retries exhausted, rethrow
          throw err;
        }

        throw err;
      }
    }

    if (!createdUser) {
      throw new BadRequestException('تعذر إنشاء الحساب، يرجى المحاولة مرة أخرى');
    }

    await this.audit.logAudit({
      email: maskedPhone,
      userId: createdUser.id,
      success: true,
      method: 'PHONE',
      ip,
      userAgent,
    });

    const accessToken = await this.tokens.signAccessToken(createdUser);
    const refreshToken = await this.tokens.generateRefreshToken(
      createdUser.id,
    );

    return {
      accessToken,
      refreshToken,
      user: this.tokens.sanitizeUser(createdUser),
    };
  }
}
