import {
  Controller, Get, Post, Patch, Body, Param, Query, Req,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { CarrierProfileService } from './carrier-profile.service';
import { TransportRequestService } from './transport-request.service';
import { TransportQuoteService } from './transport-quote.service';
import { TransportBookingService } from './transport-booking.service';
import { TransportReviewService } from './transport-review.service';
import { CreateCarrierProfileDto } from './dto/create-carrier-profile.dto';
import { UpdateCarrierProfileDto } from './dto/update-carrier-profile.dto';
import { CreateTransportRequestDto } from './dto/create-transport-request.dto';
import { UpdateTransportRequestDto } from './dto/update-transport-request.dto';
import { QueryTransportRequestsDto } from './dto/query-transport-requests.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QueryCarriersDto } from './dto/query-carriers.dto';
import { Request } from 'express';

@Controller('transport')
export class TransportController {
  constructor(
    private readonly carrierProfileService: CarrierProfileService,
    private readonly transportRequestService: TransportRequestService,
    private readonly transportQuoteService: TransportQuoteService,
    private readonly transportBookingService: TransportBookingService,
    private readonly transportReviewService: TransportReviewService,
  ) {}

  // ─── Carrier Profile ───

  @UseGuards(JwtAuthGuard)
  @Post('carrier-profile')
  createCarrierProfile(@CurrentUser() user: JwtPayload, @Body() dto: CreateCarrierProfileDto) {
    return this.carrierProfileService.create(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('carrier-profile/me')
  getMyCarrierProfile(@CurrentUser() user: JwtPayload) {
    return this.carrierProfileService.getMyProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('carrier-profile')
  updateCarrierProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateCarrierProfileDto) {
    return this.carrierProfileService.update(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('carrier-profile/availability')
  setAvailability(@CurrentUser() user: JwtPayload, @Body('isAvailable') isAvailable: boolean) {
    return this.carrierProfileService.setAvailability(user.sub, isAvailable);
  }

  @Get('carriers')
  findAllCarriers(@Query() query: QueryCarriersDto) {
    return this.carrierProfileService.findAll(query);
  }

  @Get('carriers/:id')
  findOneCarrier(@Param('id') id: string) {
    return this.carrierProfileService.findOne(id);
  }

  @Get('carriers/:id/reviews')
  getCarrierReviews(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.transportReviewService.getCarrierReviews(id, page, limit);
  }

  @Get('stats')
  getPublicStats() {
    return this.carrierProfileService.getPublicStats();
  }

  // ─── Transport Requests ───

  @UseGuards(JwtAuthGuard)
  @Post('requests')
  createRequest(@CurrentUser() user: JwtPayload, @Body() dto: CreateTransportRequestDto) {
    return this.transportRequestService.create(user.sub, dto);
  }

  @Get('requests')
  findAllRequests(@Query() query: QueryTransportRequestsDto) {
    return this.transportRequestService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('requests/my')
  myRequests(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.transportRequestService.myRequests(user.sub, page, limit, status);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('requests/:id')
  findOneRequest(
    @Param('id') id: string,
    @Req() req: Request,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.transportRequestService.findOne(id, req.ip, user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('requests/:id/cancel')
  cancelRequest(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.transportRequestService.cancel(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('requests/:id')
  updateRequest(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTransportRequestDto,
  ) {
    return this.transportRequestService.update(id, user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('requests/:id/repost')
  repostRequest(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.transportRequestService.repost(id, user.sub);
  }

  // ─── Quotes ───

  @UseGuards(JwtAuthGuard)
  @Post('requests/:id/quotes')
  submitQuote(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.transportQuoteService.submitQuote(id, user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('requests/:id/quotes')
  getQuotesForRequest(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.transportQuoteService.getQuotesForRequest(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('quotes/:id/accept')
  acceptQuote(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.transportQuoteService.acceptQuote(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('quotes/:id/withdraw')
  withdrawQuote(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.transportQuoteService.withdrawQuote(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('quotes/my')
  getMyQuotes(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.transportQuoteService.getMyQuotes(user.sub, page, limit, status);
  }

  // ─── Bookings ───

  @UseGuards(JwtAuthGuard)
  @Patch('bookings/:id/start')
  markInProgress(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.transportBookingService.markInProgress(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('bookings/:id/complete')
  completeBooking(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body('deliveryNote') deliveryNote?: string,
  ) {
    return this.transportBookingService.complete(id, user.sub, deliveryNote);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('bookings/:id/cancel')
  cancelBooking(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body('reason') reason?: string,
  ) {
    return this.transportBookingService.cancel(id, user.sub, reason);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings/my')
  getMyBookings(
    @CurrentUser() user: JwtPayload,
    @Query('role') role: 'shipper' | 'carrier' = 'shipper',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ) {
    return this.transportBookingService.getMyBookings(user.sub, role, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings/:id')
  findOneBooking(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.transportBookingService.findOne(id, user.sub);
  }

  // ─── Reviews ───

  @UseGuards(JwtAuthGuard)
  @Post('bookings/:id/review')
  createReview(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body('rating', ParseIntPipe) rating: number,
    @Body('comment') comment?: string,
  ) {
    return this.transportReviewService.createReview(id, user.sub, rating, comment);
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings/:id/review')
  getBookingReview(@Param('id') id: string) {
    return this.transportReviewService.getBookingReview(id);
  }
}
