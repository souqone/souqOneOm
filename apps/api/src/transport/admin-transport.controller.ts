import {
  Controller, Get, Patch, Delete, Param, Query, Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { QueryTransportRequestsDto } from './dto/query-transport-requests.dto';
import { QueryCarriersDto } from './dto/query-carriers.dto';

@Controller('admin/transport')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminTransportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('requests')
  async listRequests(@Query() query: QueryTransportRequestsDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.serviceType) where.serviceType = query.serviceType;
    if (query.fromGovernorate) where.fromGovernorate = query.fromGovernorate;
    if (query.userId) where.userId = query.userId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transportRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, displayName: true } },
          _count: { select: { quotes: true } },
        },
      }),
      this.prisma.transportRequest.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  @Get('carriers')
  async listCarriers(@Query() query: QueryCarriersDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.governorate) where.governorate = query.governorate;
    if (query.isAvailable !== undefined) where.isAvailable = query.isAvailable;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.carrierProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true, displayName: true } } },
      }),
      this.prisma.carrierProfile.count({ where }),
    ]);

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  @Get('stats')
  async getStats() {
    const [
      requestsTotal, requestsOpen, requestsQuoted, requestsAccepted,
      requestsInProgress, requestsCompleted, requestsCancelled, requestsExpired,
      quotesTotal, quotesAccepted, quotesRejected, quotesPending,
      carriersTotal, carriersAvailable, carriersVerified,
      bookingsTotal, bookingsCompleted, bookingsCancelled,
    ] = await this.prisma.$transaction([
      this.prisma.transportRequest.count(),
      this.prisma.transportRequest.count({ where: { status: 'OPEN' } }),
      this.prisma.transportRequest.count({ where: { status: 'QUOTED' } }),
      this.prisma.transportRequest.count({ where: { status: 'ACCEPTED' } }),
      this.prisma.transportRequest.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.transportRequest.count({ where: { status: 'COMPLETED' } }),
      this.prisma.transportRequest.count({ where: { status: 'CANCELLED' } }),
      this.prisma.transportRequest.count({ where: { status: 'EXPIRED' } }),
      this.prisma.transportQuote.count(),
      this.prisma.transportQuote.count({ where: { status: 'ACCEPTED' } }),
      this.prisma.transportQuote.count({ where: { status: 'REJECTED' } }),
      this.prisma.transportQuote.count({ where: { status: 'PENDING' } }),
      this.prisma.carrierProfile.count(),
      this.prisma.carrierProfile.count({ where: { isAvailable: true } }),
      this.prisma.carrierProfile.count({ where: { isVerified: true } }),
      this.prisma.transportBooking.count(),
      this.prisma.transportBooking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.transportBooking.count({ where: { status: 'CANCELLED' } }),
    ]);

    return {
      requests: {
        total: requestsTotal, open: requestsOpen, quoted: requestsQuoted,
        accepted: requestsAccepted, inProgress: requestsInProgress,
        completed: requestsCompleted, cancelled: requestsCancelled, expired: requestsExpired,
      },
      quotes: { total: quotesTotal, accepted: quotesAccepted, rejected: quotesRejected, pending: quotesPending },
      carriers: { total: carriersTotal, available: carriersAvailable, verified: carriersVerified },
      bookings: { total: bookingsTotal, completed: bookingsCompleted, cancelled: bookingsCancelled },
    };
  }

  @Patch('requests/:id')
  async updateRequestStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.prisma.transportRequest.update({
      where: { id },
      data: { status: status as any },
    });
  }

  @Delete('requests/:id')
  async deleteRequest(@Param('id') id: string) {
    await this.prisma.transportRequest.delete({ where: { id } });
    return { message: 'تم حذف الطلب بنجاح' };
  }
}
