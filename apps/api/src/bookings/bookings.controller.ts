import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: JwtPayload) {
    return this.bookingsService.create(dto, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyBookings(@Query() query: QueryBookingsDto, @CurrentUser() user: JwtPayload) {
    return this.bookingsService.findMyBookings(user.sub, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('received')
  findReceivedBookings(@Query() query: QueryBookingsDto, @CurrentUser() user: JwtPayload) {
    return this.bookingsService.findReceivedBookings(user.sub, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('availability/:entityType/:entityId')
  getAvailability(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.bookingsService.getAvailability(entityType, entityId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('calculate-price')
  calculatePrice(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.bookingsService.calculatePriceForEntity(entityType, entityId, startDate, endDate);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.bookingsService.findOne(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.bookingsService.updateStatus(id, dto, user.sub);
  }
}
