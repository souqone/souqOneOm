import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { OtpPurpose } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PhoneOtpService } from './phone-otp.service';
import {
  normalizePhoneStrict,
  getAllowedCountryCodes,
} from '../common/utils/normalize-phone';

@Injectable()
export class PhoneVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phoneOtpService: PhoneOtpService,
  ) {}

  /**
   * Requests a WhatsApp OTP code for the logged-in user's profile phone.
   */
  async requestVerification(
    userId: string,
    ip?: string,
  ): Promise<{ sent: true } | { alreadyVerified: true }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (!user.phone || (typeof user.phone === 'string' && user.phone.trim() === '')) {
      throw new HttpException(
        {
          statusCode: 400,
          code: 'PHONE_REQUIRED',
          message: 'يرجى إضافة رقم الهاتف في ملفك الشخصي أولاً قبل طلب التوثيق',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const strictResult = normalizePhoneStrict(user.phone.trim(), {
      allowedCountryCodes: getAllowedCountryCodes(),
    });

    if (!strictResult) {
      throw new HttpException(
        {
          statusCode: 400,
          code: 'PHONE_INVALID',
          message: 'رقم الهاتف الحالي غير صالح أو غير مدعوم، يرجى تعديله في الملف الشخصي',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const phoneE164 = strictResult.e164;

    // Idempotent: already verified on this exact number
    if (user.phoneVerifiedAt && user.phoneE164 === phoneE164) {
      return { alreadyVerified: true };
    }

    // Pre-check phone ownership: reject if already verified and claimed by another user
    const existingOwner = await this.prisma.user.findUnique({
      where: { phoneE164 },
      select: { id: true },
    });

    if (existingOwner && existingOwner.id !== userId) {
      throw new HttpException(
        {
          statusCode: 409,
          code: 'PHONE_ALREADY_VERIFIED',
          message: 'رقم الهاتف هذا موثق بالفعل لحساب آخر',
        },
        HttpStatus.CONFLICT,
      );
    }

    await this.phoneOtpService.request({
      phoneE164,
      purpose: OtpPurpose.PHONE_VERIFY,
      ip,
      userId,
    });

    return { sent: true };
  }

  /**
   * Verifies the WhatsApp OTP code and marks phone as verified.
   */
  async verifyPhone(
    userId: string,
    code: string,
  ): Promise<{ phoneVerified: true }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (!user.phone || (typeof user.phone === 'string' && user.phone.trim() === '')) {
      throw new HttpException(
        {
          statusCode: 400,
          code: 'PHONE_REQUIRED',
          message: 'يرجى إضافة رقم الهاتف في ملفك الشخصي أولاً قبل طلب التوثيق',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const strictResult = normalizePhoneStrict(user.phone.trim(), {
      allowedCountryCodes: getAllowedCountryCodes(),
    });

    if (!strictResult) {
      throw new HttpException(
        {
          statusCode: 400,
          code: 'PHONE_INVALID',
          message: 'رقم الهاتف الحالي غير صالح أو غير مدعوم، يرجى تعديله في الملف الشخصي',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const phoneE164 = strictResult.e164;

    // Idempotent: already verified on this exact number
    if (user.phoneVerifiedAt && user.phoneE164 === phoneE164) {
      return { phoneVerified: true };
    }

    // Pre-check phone ownership before OTP verification so we don't burn the code
    const existingOwner = await this.prisma.user.findUnique({
      where: { phoneE164 },
      select: { id: true },
    });

    if (existingOwner && existingOwner.id !== userId) {
      throw new HttpException(
        {
          statusCode: 409,
          code: 'PHONE_ALREADY_VERIFIED',
          message: 'رقم الهاتف هذا موثق بالفعل لحساب آخر',
        },
        HttpStatus.CONFLICT,
      );
    }

    // Verify OTP challenge (verifies purpose, code, expiry, attempts, and userId binding)
    await this.phoneOtpService.verify({
      phoneE164,
      purpose: OtpPurpose.PHONE_VERIFY,
      code,
      userId,
    });

    // Write phoneE164 and phoneVerifiedAt to user
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          phoneE164,
          phoneVerifiedAt: new Date(),
        },
      });
    } catch (err: any) {
      if (
        err?.code === 'P2002' ||
        err?.message?.includes('P2002') ||
        (err?.meta?.target &&
          Array.isArray(err.meta.target) &&
          err.meta.target.includes('phoneE164'))
      ) {
        throw new HttpException(
          {
            statusCode: 409,
            code: 'PHONE_ALREADY_VERIFIED',
            message: 'رقم الهاتف هذا موثق بالفعل لحساب آخر',
          },
          HttpStatus.CONFLICT,
        );
      }
      throw err;
    }

    return { phoneVerified: true };
  }
}
