import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { normalizePhone } from '../common/utils/normalize-phone';
import { CONTACT_REGISTRY } from './contact.registry';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getContact(entityType: string, entityId: string, viewerId: string) {
    const entry = CONTACT_REGISTRY[entityType];
    if (!entry) {
      throw new NotFoundException('جهة الاتصال غير موجودة');
    }

    // 1+2. Direct DB lookup (not from Redis cache) + visibility gate
    const target = await entry.loadTarget(this.prisma, entityId, viewerId);

    // 3. If viewer is the owner -> reject with BadRequestException
    if (viewerId === target.ownerId) {
      throw new BadRequestException('لا يمكنك عرض بيانات التواصل لإعلانك الخاص');
    }

    // 3b. Verify owner exists and is ACTIVE before any reveal recording or counter increment
    const seller = await this.prisma.user.findUnique({
      where: { id: target.ownerId },
      select: { phone: true, status: true },
    });

    if (!seller || seller.status !== 'ACTIVE') {
      throw new NotFoundException('جهة الاتصال غير موجودة');
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

    // 6. Normalize seller phone
    const normalized = normalizePhone(seller.phone);
    const phone = normalized;
    const whatsappNumber = target.whatsappEnabled ? normalized : null;

    return {
      phone,
      whatsappNumber,
    };
  }
}
