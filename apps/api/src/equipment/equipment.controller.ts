import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { EquipmentListingsService } from './equipment-listings.service';
import { CreateEquipmentListingDto } from './dto/create-equipment-listing.dto';
import { UpdateEquipmentListingDto } from './dto/update-equipment-listing.dto';
import { QueryEquipmentListingsDto } from './dto/query-equipment-listings.dto';

@Controller('equipment')
export class EquipmentController {
  constructor(private readonly svc: EquipmentListingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateEquipmentListingDto, @CurrentUser() user: JwtPayload) {
    return this.svc.create(dto, user.sub);
  }

  @Get()
  findAll(@Query() query: QueryEquipmentListingsDto) {
    return this.svc.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  my(@CurrentUser() user: JwtPayload) {
    return this.svc.my(user.sub);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEquipmentListingDto, @CurrentUser() user: JwtPayload) {
    return this.svc.update(id, user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.remove(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/images')
  addImages(@Param('id') id: string, @Body() body: { urls: string[] }, @CurrentUser() user: JwtPayload) {
    return this.svc.addImages(id, user.sub, body.urls);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('images/:imageId')
  removeImage(@Param('imageId') imageId: string, @CurrentUser() user: JwtPayload) {
    return this.svc.removeImage(imageId, user.sub);
  }
}
