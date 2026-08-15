import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { USER_SELECT } from '../common/utils/entity.utils';

const IMAGES_INCLUDE = { images: { orderBy: { order: 'asc' as const }, take: 5 } } as const;
const USER_INCLUDE = { user: { select: USER_SELECT } } as const;
const SELLER_INCLUDE = { seller: { select: USER_SELECT } } as const;

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async toggle(
    entityType: string,
    entityId: string,
    userId: string,
  ) {
    // Validate entity exists
    const entityTitle = await this.resolveEntityTitle(entityType, entityId);
    if (!entityTitle) {
      throw new NotFoundException('العنصر غير موجود');
    }

    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_entityType_entityId: { userId, entityType, entityId },
      },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await this.prisma.favorite.create({
      data: {
        userId,
        entityType,
        entityId,
        // Keep listingId populated for LISTING type (backward compat)
        ...(entityType === 'LISTING' ? { listingId: entityId } : {}),
      },
    });

    // Notify owner — goes through full pipeline: WebSocket + Push
    try {
      const ownerInfo = await this.resolveEntityOwner(entityType, entityId);
      if (ownerInfo && ownerInfo.ownerId !== userId) {
        await this.notifications.create({
          type: 'LISTING_FAVORITED',
          title: 'إعلانك أُعجب به',
          body: `أحد المستخدمين أضاف "${ownerInfo.title}" للمفضلة`,
          userId: ownerInfo.ownerId,
          data: { entityType, entityId },
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to send favorite notification: ${(err as Error).message}`);
    }

    return { favorited: true };
  }

  async getUserFavorites(
    userId: string,
    entityType?: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...(entityType ? { entityType } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.favorite.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listing: {
            include: {
              images: { orderBy: { order: 'asc' }, take: 5 },
              seller: { select: USER_SELECT },
            },
          },
        },
      }),
      this.prisma.favorite.count({ where }),
    ]);

    // Enrich favorites with full entity data for proper card rendering
    const enriched = await Promise.all(
      items.map(async (fav) => {
        const base = {
          id: fav.id,
          entityType: fav.entityType,
          entityId: fav.entityId,
          createdAt: fav.createdAt,
        };

        if (fav.entityType === 'LISTING' && fav.listing) {
          return {
            ...base,
            listing: fav.listing,
            entity: {
              id: fav.listing.id,
              title: fav.listing.title,
              image: fav.listing.images?.[0]?.url || null,
            },
          };
        }

        // Fetch full entity data so frontend can show badges/chips/details
        const fullEntity = await this.resolveFullEntity(fav.entityType, fav.entityId);
        const entity = await this.resolveEntity(fav.entityType, fav.entityId);

        return {
          ...base,
          listing: fav.listing,
          entity,
          // Full entity data keyed by type for frontend transformers
          ...(fullEntity && fav.entityType === 'BUS_LISTING'        ? { busListing: fullEntity }        : {}),
          ...(fullEntity && fav.entityType === 'EQUIPMENT_LISTING'  ? { equipmentListing: fullEntity }  : {}),
          ...(fullEntity && fav.entityType === 'OPERATOR_LISTING'   ? { operatorListing: fullEntity }   : {}),
          ...(fullEntity && fav.entityType === 'SPARE_PART'         ? { sparePart: fullEntity }         : {}),
          ...(fullEntity && fav.entityType === 'CAR_SERVICE'        ? { carService: fullEntity }        : {}),
          ...(fullEntity && fav.entityType === 'JOB'                ? { job: fullEntity }               : {}),
        };
      }),
    );

    return {
      items: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async checkFavorite(entityType: string, entityId: string, userId: string) {
    const fav = await this.prisma.favorite.findUnique({
      where: {
        userId_entityType_entityId: { userId, entityType, entityId },
      },
    });

    return { favorited: !!fav };
  }

  async getUserFavoriteIds(userId: string, entityType?: string) {
    const where = { userId, ...(entityType ? { entityType } : {}) };
    const favs = await this.prisma.favorite.findMany({
      where,
      select: { entityType: true, entityId: true },
    });
    return favs.map((f) => `${f.entityType}:${f.entityId}`);
  }

  private async resolveEntityOwner(
    entityType: string,
    entityId: string,
  ): Promise<{ ownerId: string; title: string } | null> {
    try {
      switch (entityType) {
        case 'LISTING': {
          const r = await this.prisma.listing.findUnique({ where: { id: entityId }, select: { sellerId: true, title: true } });
          return r ? { ownerId: r.sellerId, title: r.title } : null;
        }
        case 'BUS_LISTING': {
          const r = await this.prisma.busListing.findUnique({ where: { id: entityId }, select: { userId: true, title: true } });
          return r ? { ownerId: r.userId, title: r.title } : null;
        }
        case 'EQUIPMENT_LISTING': {
          const r = await this.prisma.equipmentListing.findUnique({ where: { id: entityId }, select: { userId: true, title: true } });
          return r ? { ownerId: r.userId, title: r.title } : null;
        }
        case 'OPERATOR_LISTING': {
          const r = await this.prisma.operatorListing.findUnique({ where: { id: entityId }, select: { userId: true, title: true } });
          return r ? { ownerId: r.userId, title: r.title } : null;
        }
        case 'SPARE_PART': {
          const r = await this.prisma.sparePart.findUnique({ where: { id: entityId }, select: { sellerId: true, title: true } });
          return r ? { ownerId: r.sellerId, title: r.title } : null;
        }
        case 'CAR_SERVICE': {
          const r = await this.prisma.carService.findUnique({ where: { id: entityId }, select: { userId: true, title: true } });
          return r ? { ownerId: r.userId, title: r.title } : null;
        }
        case 'JOB': {
          const r = await this.prisma.driverJob.findUnique({ where: { id: entityId }, select: { userId: true, title: true } });
          return r ? { ownerId: r.userId, title: r.title } : null;
        }
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  private async resolveEntityTitle(
    entityType: string,
    entityId: string,
  ): Promise<string | null> {
    try {
      switch (entityType) {
        case 'LISTING': {
          const r = await this.prisma.listing.findUnique({ where: { id: entityId }, select: { title: true } });
          return r?.title || null;
        }
        case 'JOB': {
          const r = await this.prisma.driverJob.findUnique({ where: { id: entityId }, select: { title: true } });
          return r?.title || null;
        }
        case 'SPARE_PART': {
          const r = await this.prisma.sparePart.findUnique({ where: { id: entityId }, select: { title: true } });
          return r?.title || null;
        }
        case 'CAR_SERVICE': {
          const r = await this.prisma.carService.findUnique({ where: { id: entityId }, select: { title: true } });
          return r?.title || null;
        }
        case 'BUS_LISTING': {
          const r = await this.prisma.busListing.findUnique({ where: { id: entityId }, select: { title: true } });
          return r?.title || null;
        }
        case 'EQUIPMENT_LISTING': {
          const r = await this.prisma.equipmentListing.findUnique({ where: { id: entityId }, select: { title: true } });
          return r?.title || null;
        }
        case 'OPERATOR_LISTING': {
          const r = await this.prisma.operatorListing.findUnique({ where: { id: entityId }, select: { title: true } });
          return r?.title || null;
        }
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  private async resolveEntity(
    entityType: string,
    entityId: string,
  ): Promise<{ id: string; title: string; image: string | null } | null> {
    try {
      switch (entityType) {
        case 'JOB': {
          const r = await this.prisma.driverJob.findUnique({ where: { id: entityId }, select: { id: true, title: true } });
          return r ? { id: r.id, title: r.title, image: null } : null;
        }
        case 'SPARE_PART': {
          const r = await this.prisma.sparePart.findUnique({
            where: { id: entityId },
            select: { id: true, title: true, images: { take: 1, orderBy: { order: 'asc' } } },
          });
          return r ? { id: r.id, title: r.title, image: (r.images as any)?.[0]?.url || null } : null;
        }
        case 'CAR_SERVICE': {
          const r = await this.prisma.carService.findUnique({
            where: { id: entityId },
            select: { id: true, title: true, images: { take: 1, orderBy: { order: 'asc' } } },
          });
          return r ? { id: r.id, title: r.title, image: (r.images as any)?.[0]?.url || null } : null;
        }
        case 'BUS_LISTING': {
          const r = await this.prisma.busListing.findUnique({
            where: { id: entityId },
            select: { id: true, title: true, images: { take: 1, orderBy: { order: 'asc' } } },
          });
          return r ? { id: r.id, title: r.title, image: (r.images as any)?.[0]?.url || null } : null;
        }
        case 'EQUIPMENT_LISTING': {
          const r = await this.prisma.equipmentListing.findUnique({
            where: { id: entityId },
            select: { id: true, title: true, images: { take: 1, orderBy: { order: 'asc' } } },
          });
          return r ? { id: r.id, title: r.title, image: (r.images as any)?.[0]?.url || null } : null;
        }
        case 'OPERATOR_LISTING': {
          const r = await this.prisma.operatorListing.findUnique({
            where: { id: entityId },
            select: { id: true, title: true },
          });
          return r ? { id: r.id, title: r.title, image: null } : null;
        }
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Returns the FULL entity record (all fields + images + user/seller)
   * so the frontend can run the proper category transformer and show
   * badges, chips, details, price, etc.
   */
  private async resolveFullEntity(
    entityType: string,
    entityId: string,
  ): Promise<Record<string, any> | null> {
    try {
      switch (entityType) {
        case 'BUS_LISTING': {
          return this.prisma.busListing.findUnique({
            where: { id: entityId },
            include: { ...IMAGES_INCLUDE, ...USER_INCLUDE },
          });
        }
        case 'EQUIPMENT_LISTING': {
          return this.prisma.equipmentListing.findUnique({
            where: { id: entityId },
            include: { ...IMAGES_INCLUDE, ...USER_INCLUDE },
          });
        }
        case 'OPERATOR_LISTING': {
          return this.prisma.operatorListing.findUnique({
            where: { id: entityId },
            include: USER_INCLUDE,
          });
        }
        case 'SPARE_PART': {
          return this.prisma.sparePart.findUnique({
            where: { id: entityId },
            include: { ...IMAGES_INCLUDE, ...SELLER_INCLUDE },
          });
        }
        case 'CAR_SERVICE': {
          return this.prisma.carService.findUnique({
            where: { id: entityId },
            include: { ...IMAGES_INCLUDE, ...USER_INCLUDE },
          });
        }
        case 'JOB': {
          return this.prisma.driverJob.findUnique({
            where: { id: entityId },
            include: USER_INCLUDE,
          });
        }
        default:
          return null;
      }
    } catch {
      return null;
    }
  }
}
