import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizePhone } from '../utils/normalize-phone';

@Injectable()
export class SellerContactGate {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Asserts that a user has a valid phone number in their profile before publishing/activating listings.
   * Throws BadRequestException with PROFILE_PHONE_REQUIRED if missing or invalid.
   */
  async assertCanPublish(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

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
