import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import type { JwtPayload } from '../auth/auth.types';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  create(@Body() dto: CreateServiceDto, @CurrentUser() user: JwtPayload) {
    return this.servicesService.create(dto, user.sub);
  }

  @Get()
  findAll(@Query() query: QueryServicesDto) {
    return this.servicesService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  myServices(@CurrentUser() user: JwtPayload, @Query() query: PaginationQueryDto) {
    return this.servicesService.myListings(user.sub, query.page ?? 1, query.limit ?? 20);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string, @Req() req: Request, @CurrentUser() user?: JwtPayload) {
    return this.servicesService.findBySlug(slug, req.ip, user);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request, @CurrentUser() user?: JwtPayload) {
    return this.servicesService.findOne(id, req.ip, user);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Patch(':id/status')
  toggleStatus(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.servicesService.toggleStatus(id, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto, @CurrentUser() user: JwtPayload) {
    return this.servicesService.update(id, user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.servicesService.remove(id, user.sub);
  }
}
