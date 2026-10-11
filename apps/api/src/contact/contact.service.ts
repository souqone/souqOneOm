import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { assertListingVisible, assertEntityVisible } from '../listings/listing-visibility';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';
import { normalizePhone } from '../common/utils/normalize-phone';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Resolves the minimal, uncached record needed to serve contact details for an entity type,
   * enforcing that vertical's visibility gate. Adding a vertical = add one branch here.
   */
  private async loadContactTarget(entityType: string, entityId: string, viewerId: string) {
    if (entityType === ENTITY_TYPES.BUS_LISTING) {
      const bus = await this.prisma.busListing.findFirst({
        where: { id: entityId, deletedAt: null },
        select: {
          id: true,
          userId: true,
          status: true,
          whatsappEnabled: true,
          contactPhone: true,
          whatsapp: true,
        },
      });
      if (!bus) throw new NotFoundException('الإعلان غير موجود');
      assertEntityVisible(bus, bus.userId, viewerId);
      return {
        ownerId: bus.userId,
        whatsappEnabled: bus.whatsappEnabled,
        listingPhone: bus.contactPhone,
        listingWhatsapp: bus.whatsapp,
      };
    }

    // Cars (LISTING)
    const listing = await this.prisma.listing.findUnique({
      where: { id: entityId },
      select: {
        id: true,
        sellerId: true,
        status: true,
        whatsappEnabled: true,
      },
    });
    if (!listing) throw new NotFoundException('الإعلان غير موجود');
    assertListingVisible(listing, viewerId);
    return {
      ownerId: listing.sellerId,
      whatsappEnabled: listing.whatsappEnabled,
      listingPhone: null as string | null,
      listingWhatsapp: null as string | null,
    };
  }

  async getContact(entityType: string, entityId: string, viewerId: string) {
    if (entityType !== ENTITY_TYPES.LISTING && entityType !== ENTITY_TYPES.BUS_LISTING) {
      throw new NotFoundException('جهة الاتصال غير موجودة');
    }

    // 1+2. Direct DB lookup (not from Redis cache) + visibility gate
    const target = await this.loadContactTarget(entityType, entityId, viewerId);
    const listing = { sellerId: target.ownerId, whatsappEnabled: target.whatsappEnabled };

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

    // Bus listings can carry their own contact numbers; fall back to the owner's profile phone.
    const phone = normalizePhone(target.listingPhone) ?? normalizePhone(seller?.phone);
    const whatsappNumber = listing.whatsappEnabled
      ? normalizePhone(target.listingWhatsapp) ?? phone
      : null;

    return {
      phone,
      whatsappNumber,
    };
  }
}
