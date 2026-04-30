import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { EquipmentRequestsService } from './equipment-requests.service';
import { EquipmentBidsService } from './equipment-bids.service';
import { CreateEquipmentRequestDto } from './dto/create-equipment-request.dto';
import { UpdateEquipmentRequestDto } from './dto/update-equipment-request.dto';
import { QueryEquipmentRequestsDto } from './dto/query-equipment-requests.dto';
import { CreateEquipmentBidDto } from './dto/create-equipment-bid.dto';

@Controller('equipment-requests')
export class EquipmentRequestsController {
  constructor(
    private readonly reqSvc: EquipmentRequestsService,
    private readonly bidSvc: EquipmentBidsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateEquipmentRequestDto, @CurrentUser() user: JwtPayload) {
    return this.reqSvc.create(dto, user.sub);
  }

  @Get()
  findAll(@Query() query: QueryEquipmentRequestsDto) {
    return this.reqSvc.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  my(@CurrentUser() user: JwtPayload) {
    return this.reqSvc.my(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reqSvc.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEquipmentRequestDto, @CurrentUser() user: JwtPayload) {
    return this.reqSvc.update(id, user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  changeStatus(@Param('id') id: string, @Body() body: { requestStatus: string }, @CurrentUser() user: JwtPayload) {
    return this.reqSvc.changeStatus(id, user.sub, body.requestStatus);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.reqSvc.remove(id, user.sub);
  }

  // ─── Bids ───

  @UseGuards(JwtAuthGuard)
  @Post(':id/bids')
  createBid(@Param('id') id: string, @Body() dto: CreateEquipmentBidDto, @CurrentUser() user: JwtPayload) {
    return this.bidSvc.create(id, dto, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/bids/:bidId/accept')
  acceptBid(@Param('id') id: string, @Param('bidId') bidId: string, @CurrentUser() user: JwtPayload) {
    return this.bidSvc.accept(id, bidId, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/bids/:bidId/reject')
  rejectBid(@Param('id') id: string, @Param('bidId') bidId: string, @CurrentUser() user: JwtPayload) {
    return this.bidSvc.reject(id, bidId, user.sub);
  }
}
