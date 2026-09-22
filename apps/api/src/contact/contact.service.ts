import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { assertListingVisible } from '../listings/listing-visibility';
import { normalizePhone } from '../common/utils/normalize-phone';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getContact(entityType: string, entityId: string, viewerId: string) {
    if (entityType !== 'LISTING') {
      throw new NotFoundException('جهة الاتصال غير موجودة');
    }

    // 1. Direct DB lookup (minimal query, not from Redis cache)
    const listing = await this.prisma.listing.findUnique({
      where: { id: entityId },
      select: {
        id: true,
        sellerId: true,
        status: true,
        whatsappEnabled: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    // 2. Visibility gate check
    assertListingVisible(listing, viewerId);

    // 3. If viewer is the owner -> reject with BadRequestException
    if (viewerId === listing.sellerId) {
      throw new BadRequestException('لا يمكنك عرض بيانات التواصل لإعلانك الخاص');
    }

    // 4. Daily distinct-listing reveal cap check
    const date = new Date().toISOString().split('T')[0];
    const memberKey = `contact-cap:${viewerId}:${date}:${entityId}`;
    const counterKey = `contact-cap:${viewerId}:${date}:count`;

    const alreadyRevealed = await this.redis.exists(memberKey);

    if (!alreadyRevealed) {
      const currentCount = await this.redis.get<number>(counterKey);
      if (currentCount && Number(currentCount) >= 50) {
        throw new HttpException(
          'لقد تجاوزت الحد اليومي لعرض أرقام التواصل (50 إعلاناً في اليوم)',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 5. Record reveal and increment daily distinct count if not already revealed
    if (!alreadyRevealed) {
      await this.redis.set(memberKey, '1', 86400);
      await this.redis.incr(counterKey, 86400);
    }

    // 6. Load seller phone and normalize
    const seller = await this.prisma.user.findUnique({
      where: { id: listing.sellerId },
      select: { phone: true },
    });

    const normalized = normalizePhone(seller?.phone);
    const phone = normalized;
    const whatsappNumber = listing.whatsappEnabled ? normalized : null;

    return {
      phone,
      whatsappNumber,
    };
  }
}
