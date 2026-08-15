import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const SELLER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  governorate: true,
  isVerified: true,
  createdAt: true,
  phone: true,
};

const DEFAULT_INCLUDE = {
  seller: { select: SELLER_SELECT },
  images: true,
  governorateRef: true,
  wilayaRef: true,
} as const;

@Injectable()
export class ListingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ListingCreateInput) {
    return this.prisma.listing.create({
      data,
      include: DEFAULT_INCLUDE,
    });
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
        include: DEFAULT_INCLUDE,
      }),
      this.prisma.listing.count({ where }),
    ]);
  }

  async findById(id: string) {
    return this.prisma.listing.findUnique({
      where: { id },
      include: DEFAULT_INCLUDE,
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.listing.findUnique({
      where: { slug },
      include: DEFAULT_INCLUDE,
    });
  }

  async update(id: string, data: Prisma.ListingUpdateInput) {
    return this.prisma.listing.update({
      where: { id },
      data,
      include: DEFAULT_INCLUDE,
    });
  }

  async delete(id: string) {
    return this.prisma.listing.delete({ where: { id } });
  }

  async incrementViewCount(id: string) {
    return this.prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }
}
