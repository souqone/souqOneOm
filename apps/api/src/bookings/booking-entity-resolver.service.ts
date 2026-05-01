import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CancellationPolicy, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type BookingEntityConnectField =
  | { listing: { connect: { id: string } } }
  | { busListing: { connect: { id: string } } }
  | { equipmentListing: { connect: { id: string } } }
  | { transportService: { connect: { id: string } } };

export interface ResolvedBookingEntity {
  title: string;
  ownerId: string;
  dailyPrice: number | null;
  weeklyPrice: number | null;
  monthlyPrice: number | null;
  minRentalDays: number | null;
  depositAmount: Prisma.Decimal | null;
  currency: string;
  cancellationPolicy: CancellationPolicy;
  connectField: BookingEntityConnectField;
}

@Injectable()
export class BookingEntityResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(entityType: string, entityId: string): Promise<ResolvedBookingEntity> {
    switch (entityType) {
      case 'CAR': {
        const listing = await this.prisma.listing.findUnique({
          where: { id: entityId },
          include: { seller: { select: { id: true, displayName: true, username: true } } },
        });
        if (!listing) throw new NotFoundException('الإعلان غير موجود');
        if (listing.listingType !== 'RENTAL') throw new BadRequestException('هذا الإعلان ليس للإيجار');
        if (listing.status !== 'ACTIVE') throw new BadRequestException('الإعلان غير متاح حالياً');
        return {
          title: listing.title,
          ownerId: listing.sellerId,
          dailyPrice: listing.dailyPrice ? Number(listing.dailyPrice) : null,
          weeklyPrice: listing.weeklyPrice ? Number(listing.weeklyPrice) : null,
          monthlyPrice: listing.monthlyPrice ? Number(listing.monthlyPrice) : null,
          minRentalDays: listing.minRentalDays,
          depositAmount: listing.depositAmount,
          currency: listing.currency,
          cancellationPolicy: listing.cancellationPolicy ?? CancellationPolicy.FREE,
          connectField: { listing: { connect: { id: entityId } } },
        };
      }
      case 'BUS': {
        const bus = await this.prisma.busListing.findUnique({
          where: { id: entityId },
          include: { user: { select: { id: true, displayName: true, username: true } } },
        });
        if (!bus) throw new NotFoundException('إعلان الباص غير موجود');
        if (bus.busListingType !== 'BUS_RENT') throw new BadRequestException('هذا الإعلان ليس للإيجار');
        if (bus.status !== 'ACTIVE') throw new BadRequestException('الإعلان غير متاح حالياً');
        return {
          title: bus.title,
          ownerId: bus.userId,
          dailyPrice: bus.dailyPrice ? Number(bus.dailyPrice) : null,
          weeklyPrice: null,
          monthlyPrice: bus.monthlyPrice ? Number(bus.monthlyPrice) : null,
          minRentalDays: bus.minRentalDays,
          depositAmount: null,
          currency: bus.currency,
          cancellationPolicy: CancellationPolicy.FREE,
          connectField: { busListing: { connect: { id: entityId } } },
        };
      }
      case 'EQUIPMENT': {
        const eq = await this.prisma.equipmentListing.findUnique({
          where: { id: entityId },
          include: { user: { select: { id: true, displayName: true, username: true } } },
        });
        if (!eq) throw new NotFoundException('إعلان المعدة غير موجود');
        if (eq.listingType !== 'EQUIPMENT_RENT') throw new BadRequestException('هذا الإعلان ليس للإيجار');
        if (eq.status !== 'ACTIVE') throw new BadRequestException('الإعلان غير متاح حالياً');
        return {
          title: eq.title,
          ownerId: eq.userId,
          dailyPrice: eq.dailyPrice ? Number(eq.dailyPrice) : null,
          weeklyPrice: eq.weeklyPrice ? Number(eq.weeklyPrice) : null,
          monthlyPrice: eq.monthlyPrice ? Number(eq.monthlyPrice) : null,
          minRentalDays: eq.minRentalDays,
          depositAmount: null,
          currency: eq.currency,
          cancellationPolicy: CancellationPolicy.FREE,
          connectField: { equipmentListing: { connect: { id: entityId } } },
        };
      }
      case 'TRANSPORT': {
        const ts = await this.prisma.transportService.findUnique({
          where: { id: entityId },
          include: { user: { select: { id: true, displayName: true, username: true } } },
        });
        if (!ts) throw new NotFoundException('خدمة النقل غير موجودة');
        if (ts.status !== 'ACTIVE') throw new BadRequestException('الخدمة غير متاحة حالياً');
        return {
          title: ts.title,
          ownerId: ts.userId,
          dailyPrice: ts.basePrice ? Number(ts.basePrice) : null,
          weeklyPrice: null,
          monthlyPrice: null,
          minRentalDays: null,
          depositAmount: null,
          currency: ts.currency,
          cancellationPolicy: CancellationPolicy.FREE,
          connectField: { transportService: { connect: { id: entityId } } },
        };
      }
      default:
        throw new BadRequestException('نوع إعلان غير مدعوم');
    }
  }
}
