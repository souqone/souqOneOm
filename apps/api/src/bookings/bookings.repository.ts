import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  governorate: true,
  isVerified: true,
  phone: true,
};

const ENTITY_INCLUDES = {
  listing: { include: { images: true } },
  busListing: { include: { images: true } },
  equipmentListing: { include: { images: true } },
};

export const FULL_INCLUDE = {
  ...ENTITY_INCLUDES,
  renter: { select: USER_SELECT },
  owner: { select: USER_SELECT },
} as const;

// Map entityType → the foreign key field on Booking
export function entityFkField(entityType: string): string {
  const map: Record<string, string> = {
    CAR: 'listingId',
    BUS: 'busListingId',
    EQUIPMENT: 'equipmentListingId',
  };
  const field = map[entityType];
  if (!field) throw new BadRequestException(`نوع كيان غير معروف: ${entityType}`);
  return field;
}

@Injectable()
export class BookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.BookingCreateInput) {
    return this.prisma.booking.create({
      data,
      include: FULL_INCLUDE,
    });
  }

  async findById(id: string, options?: { withEntityOnly?: boolean }) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: options?.withEntityOnly
        ? {
            listing: true,
            busListing: true,
            equipmentListing: true,
          }
        : {
            listing: { include: { images: true, seller: { select: USER_SELECT } } },
            busListing: { include: { images: true, user: { select: USER_SELECT } } },
            equipmentListing: { include: { images: true, user: { select: USER_SELECT } } },
            renter: { select: USER_SELECT },
            owner: { select: USER_SELECT },
          },
    });
  }

  async findMyBookings(
    where: Prisma.BookingWhereInput,
    skip: number,
    take: number,
  ) {
    return this.prisma.$transaction([
      this.prisma.booking.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          ...ENTITY_INCLUDES,
          owner: { select: USER_SELECT },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);
  }

  async findReceivedBookings(
    where: Prisma.BookingWhereInput,
    skip: number,
    take: number,
  ) {
    return this.prisma.$transaction([
      this.prisma.booking.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          ...ENTITY_INCLUDES,
          renter: { select: USER_SELECT },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);
  }

  async update(id: string, data: Prisma.BookingUpdateInput) {
    return this.prisma.booking.update({
      where: { id },
      data,
      include: FULL_INCLUDE,
    });
  }

  async findConflicting(entityType: string, entityId: string, startDate: Date, endDate: Date) {
    const fk = entityFkField(entityType);
    return this.prisma.booking.findFirst({
      where: {
        entityType,
        [fk]: entityId,
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    });
  }

  async findActiveBookings(entityType: string, entityId: string) {
    const fk = entityFkField(entityType);
    return this.prisma.booking.findMany({
      where: {
        entityType,
        [fk]: entityId,
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
      },
      select: { startDate: true, endDate: true, status: true },
      orderBy: { startDate: 'asc' },
    });
  }
}
