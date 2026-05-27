import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Req,
} from '@nestjs/common';

import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import type { JwtPayload } from '../auth/auth.types';
import { BusesService } from './buses.service';
import { CreateBusListingDto } from './dto/create-bus-listing.dto';
import { UpdateBusListingDto } from './dto/update-bus-listing.dto';
import { QueryBusListingsDto } from './dto/query-bus-listings.dto';

@Controller('buses')
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateBusListingDto, @CurrentUser() user: JwtPayload) {
    return this.busesService.create(dto, user.sub);
  }

  @Get()
  findAll(@Query() query: QueryBusListingsDto) {
    return this.busesService.findAll(query);
  }

  @Get('manufacturers')
  getManufacturers() {
    return this.busesService.getManufacturers();
  }

  @Get('models')
  getModels(@Query('manufacturerId') manufacturerId: string) {
    return this.busesService.getModelsByManufacturer(manufacturerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  myListings(@CurrentUser() user: JwtPayload, @Query() query: PaginationQueryDto) {
    return this.busesService.myListings(user.sub, query.page ?? 1, query.limit ?? 20);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string, @Req() req: Request) {
    return this.busesService.findBySlug(slug, req.ip);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.busesService.findOne(id, req.ip);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBusListingDto, @CurrentUser() user: JwtPayload) {
    return this.busesService.update(id, user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.busesService.remove(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/images')
  addImages(@Param('id') id: string, @Body() body: { urls: string[] }, @CurrentUser() user: JwtPayload) {
    return this.busesService.addImages(id, user.sub, body.urls);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('images/:imageId')
  removeImage(@Param('imageId') imageId: string, @CurrentUser() user: JwtPayload) {
    return this.busesService.removeImage(imageId, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/status-history')
  getStatusHistory(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.busesService.getStatusHistory(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/stats')
  getStats(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.busesService.getStats(id, user.sub);
  }
}
