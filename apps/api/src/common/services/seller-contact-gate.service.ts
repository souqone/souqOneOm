import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizePhone } from '../utils/normalize-phone';

@Injectable()
export class SellerContactGate {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Asserts that a user has a valid active account status AND a valid phone number
   * in their profile before publishing or activating listings across any vertical.
   *
   * Rejection criteria:
   * - BANNED -> 403 ACCOUNT_BANNED
   * - SUSPENDED (active) -> 403 ACCOUNT_SUSPENDED with ISO suspendedUntil
   * - DELETED or non-ACTIVE -> 401 UnauthorizedException
   * - Missing / invalid phone -> 400 PROFILE_PHONE_REQUIRED
   */
  async assertCanPublish(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        status: true,
        suspendedUntil: true,
      },
    });

    if (user) {
      const status = user.status ?? 'ACTIVE';

      if (status === 'BANNED') {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'ACCOUNT_BANNED',
          message: 'تم حظر حسابك لمخالفة شروط الاستخدام',
        });
      }

      if (status === 'SUSPENDED') {
        const now = new Date();
        const suspendedUntilDate = user.suspendedUntil ? new Date(user.suspendedUntil) : null;

        // Active suspension: either indefinite or expires in the future
        if (!suspendedUntilDate || suspendedUntilDate.getTime() > now.getTime()) {
          throw new ForbiddenException({
            statusCode: 403,
            code: 'ACCOUNT_SUSPENDED',
            message: 'تم إيقاف حسابك مؤقتاً',
            suspendedUntil: suspendedUntilDate ? suspendedUntilDate.toISOString() : null,
          });
        }
      }

      if (status !== 'ACTIVE') {
        throw new UnauthorizedException('بيانات الدخول غير صحيحة');
      }
    }

    const normalized = normalizePhone(user?.phone);
    if (!normalized) {
      throw new BadRequestException({
        code: 'PROFILE_PHONE_REQUIRED',
        message: 'لازم تضيف رقم هاتفك في بروفايلك الأول عشان المشترين يقدروا يتواصلوا معاك',
      });
    }

    return normalized;
  }
}
