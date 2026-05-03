import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsRepository, entityFkField, FULL_INCLUDE } from './bookings.repository';
import { BookingEntityResolverService } from './booking-entity-resolver.service';
import { BookingNotificationService } from './booking-notification.service';
import { BookingPricingService } from './booking-pricing.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: BookingsRepository,
    private readonly entityResolver: BookingEntityResolverService,
    private readonly bookingNotifications: BookingNotificationService,
    private readonly pricing: BookingPricingService,
  ) {}

  // ── حاسبة السعر ──
  calculatePrice(
    totalDays: number,
    dailyPrice?: number | null,
    weeklyPrice?: number | null,
    monthlyPrice?: number | null,
  ): { totalPrice: number; breakdown: string } {
    return this.pricing.calculatePrice(totalDays, dailyPrice, weeklyPrice, monthlyPrice);
  }

  // ── Resolve entity by type ──
  private async resolveEntity(entityType: string, entityId: string) {
    return this.entityResolver.resolve(entityType, entityId);
  }

  // ── إنشاء حجز ──
  async create(dto: CreateBookingDto, renterId: string) {
    const entity = await this.resolveEntity(dto.entityType, dto.entityId);

    if (entity.ownerId === renterId) throw new BadRequestException('لا يمكنك حجز إعلانك');

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (startDate < now) throw new BadRequestException('تاريخ البداية يجب أن يكون في المستقبل');
    if (endDate <= startDate) throw new BadRequestException('تاريخ النهاية يجب أن يكون بعد البداية');

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (entity.minRentalDays && totalDays < entity.minRentalDays) {
      throw new BadRequestException(`أقل مدة إيجار ${entity.minRentalDays} يوم`);
    }

    const { totalPrice } = this.calculatePrice(
      totalDays,
      entity.dailyPrice,
      entity.weeklyPrice,
      entity.monthlyPrice,
    );

    // Atomic: conflict check + create in one transaction to prevent race conditions
    const booking = await this.prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          entityType: dto.entityType,
          [entityFkField(dto.entityType)]: dto.entityId,
          status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
          OR: [{ startDate: { lte: endDate }, endDate: { gte: startDate } }],
        },
      });
      if (conflict) throw new BadRequestException('محجوز في هذه الفترة');

      return tx.booking.create({
        data: {
          entityType: dto.entityType,
          ...entity.connectField,
          renter: { connect: { id: renterId } },
          owner: { connect: { id: entity.ownerId } },
          startDate,
          endDate,
          totalDays,
          totalPrice: new Prisma.Decimal(totalPrice),
          depositAmount: entity.depositAmount,
          currency: entity.currency,
          status: 'PENDING',
          cancellationPolicy: entity.cancellationPolicy,
          driverRequested: dto.driverRequested ?? false,
          insuranceSelected: dto.insuranceSelected ?? false,
          pickupLocation: dto.pickupLocation,
          dropoffLocation: dto.dropoffLocation,
          notes: dto.notes,
        },
        include: FULL_INCLUDE,
      });
    });

    // إشعار للمؤجر
    await this.bookingNotifications.notifyBookingRequest(entity.ownerId, booking.id, dto.entityType, dto.entityId, entity.title);

    return booking;
  }

  // ── حجوزاتي (كمستأجر) ──
  async findMyBookings(renterId: string, query: QueryBookingsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = { renterId };
    if (query.status) where.status = query.status;

    const [items, total] = await this.repo.findMyBookings(where, skip, limit);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── الحجوزات الواردة (كمؤجر) ──
  async findReceivedBookings(ownerId: string, query: QueryBookingsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = { ownerId };
    if (query.status) where.status = query.status;

    const [items, total] = await this.repo.findReceivedBookings(where, skip, limit);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── تفاصيل حجز ──
  async findOne(id: string, userId: string) {
    const booking = await this.repo.findById(id);

    if (!booking) throw new NotFoundException('الحجز غير موجود');
    if (booking.renterId !== userId && booking.ownerId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لعرض هذا الحجز');
    }

    return booking;
  }

  // ── Helper: get entity title from booking ──
  private getEntityTitle(booking: any): string {
    if (booking.listing) return booking.listing.title;
    if (booking.busListing) return booking.busListing.title;
    if (booking.equipmentListing) return booking.equipmentListing.title;
    return 'إعلان';
  }

  // ── تغيير حالة الحجز ──
  async updateStatus(id: string, dto: UpdateBookingStatusDto, userId: string) {
    const booking = await this.repo.findById(id, { withEntityOnly: true });

    if (!booking) throw new NotFoundException('الحجز غير موجود');

    const { status } = dto;
    const isOwner = booking.ownerId === userId;
    const isRenter = booking.renterId === userId;

    // صلاحيات
    if (status === 'CONFIRMED' && !isOwner) throw new ForbiddenException('المؤجر فقط يمكنه التأكيد');
    if (status === 'REJECTED' && !isOwner) throw new ForbiddenException('المؤجر فقط يمكنه الرفض');
    if (status === 'CANCELLED' && !isRenter && !isOwner) throw new ForbiddenException('غير مصرح');
    if (status === 'ACTIVE' && !isOwner) throw new ForbiddenException('المؤجر فقط يمكنه تفعيل الحجز');
    if (status === 'COMPLETED' && !isOwner) throw new ForbiddenException('المؤجر فقط يمكنه إكمال الحجز');

    // Transitions
    const validTransitions: Record<string, BookingStatus[]> = {
      PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
      CONFIRMED: ['ACTIVE', 'CANCELLED'],
      ACTIVE: ['COMPLETED', 'CANCELLED'],
    };

    const allowed = validTransitions[booking.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(`لا يمكن تغيير الحالة من ${booking.status} إلى ${status}`);
    }

    const updateData: Prisma.BookingUpdateInput = { status };
    if (status === 'CONFIRMED') updateData.confirmedAt = new Date();
    if (status === 'CANCELLED') updateData.cancelledAt = new Date();
    if (status === 'COMPLETED') updateData.completedAt = new Date();

    const updated = await this.repo.update(id, updateData);

    // إشعارات
    const entityTitle = this.getEntityTitle(booking);
    await this.bookingNotifications.notifyStatusChange(status, id, booking.entityType, entityTitle, booking.renterId, booking.ownerId, isRenter);

    return updated;
  }

  // ── التواريخ المحجوزة ──
  async getAvailability(entityType: string, entityId: string) {
    return this.repo.findActiveBookings(entityType, entityId);
  }

  // ── حاسبة سعر API ──
  async calculatePriceForEntity(entityType: string, entityId: string, startDate: string, endDate: string) {
    const entity = await this.resolveEntity(entityType, entityId);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) throw new BadRequestException('مدة غير صالحة');

    const result = this.calculatePrice(
      totalDays,
      entity.dailyPrice,
      entity.weeklyPrice,
      entity.monthlyPrice,
    );

    return {
      totalDays,
      ...result,
      depositAmount: entity.depositAmount ? Number(entity.depositAmount) : null,
      currency: entity.currency,
    };
  }

}
