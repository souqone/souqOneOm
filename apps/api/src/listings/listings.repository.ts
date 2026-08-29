import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';

const PUBLIC_SELLER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  governorate: true,
  isVerified: true,
  createdAt: true,
  // phone is intentionally excluded for privacy
};

const PUBLIC_LISTING_INCLUDE = {
  seller: { select: PUBLIC_SELLER_SELECT },
  images: true,
  governorateRef: true,
  wilayaRef: true,
} as const;

@Injectable()
export class ListingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ListingCreateInput) {
    return this.prisma.$transaction(
      async (tx) => {
        const listing = await tx.listing.create({
          data,
          include: PUBLIC_LISTING_INCLUDE,
        });
        await tx.outboxEvent.create({
          data: {
            entityType: ENTITY_TYPES.LISTING,
            entityId: listing.id,
            action: 'UPSERT',
          },
        });
        return listing;
      },
      { maxWait: 15000, timeout: 20000 },
    );
  }

  async findMany(
    where: Prisma.ListingWhereInput,
    orderBy: Prisma.ListingOrderByWithRelationInput,
    skip: number,
    take: number,
  ) {
    return this.prisma.$transaction([
      this.prisma.listing.findMany({
        where, skip, take, orderBy,
        include: PUBLIC_LISTING_INCLUDE,
      }),
      this.prisma.listing.count({ where }),
    ]);
  }

  async findById(id: string) {
    return this.prisma.listing.findUnique({
      where: { id },
      include: PUBLIC_LISTING_INCLUDE,
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.listing.findUnique({
      where: { slug },
      include: PUBLIC_LISTING_INCLUDE,
    });
  }

  async update(id: string, data: Prisma.ListingUpdateInput, expectedVersion: number) {
    return this.prisma.$transaction(
      async (tx) => {
        const listing = await tx.listing.update({
          where: { id, version: expectedVersion },
          data: { ...data, version: { increment: 1 } },
          include: PUBLIC_LISTING_INCLUDE,
        });
        await tx.outboxEvent.create({
          data: {
            entityType: ENTITY_TYPES.LISTING,
            entityId: listing.id,
            action: 'UPSERT',
          },
        });
        return listing;
      },
      { maxWait: 15000, timeout: 20000 },
    );
  }

  async delete(id: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const listing = await tx.listing.delete({ where: { id } });
        await tx.outboxEvent.create({
          data: {
            entityType: ENTITY_TYPES.LISTING,
            entityId: id,
            action: 'DELETE',
          },
        });
        return listing;
      },
      { maxWait: 15000, timeout: 20000 },
    );
  }

  async incrementViewCount(id: string) {
    return this.prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }
}
