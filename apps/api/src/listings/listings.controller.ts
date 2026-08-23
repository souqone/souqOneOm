import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';

@ApiTags('Listings')
@ApiBearerAuth()
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a new car listing' })
  @Post()
  create(@Body() dto: CreateListingDto, @CurrentUser() user: JwtPayload) {
    return this.listingsService.create(dto, user.sub);
  }

  @Get()
  findAll(@Query() query: QueryListingsDto) {
    return this.listingsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMy(@Query() query: QueryListingsDto, @CurrentUser() user: JwtPayload) {
    return this.listingsService.findMyListings({ ...query, sellerId: user.sub });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.listingsService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Update a car listing (Requires version field for OCC)' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateListingDto, @CurrentUser() user: JwtPayload) {
    if (dto.version === undefined) {
      throw new BadRequestException('version is required');
    }
    return this.listingsService.update(id, dto, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.listingsService.remove(id, user.sub);
  }

  // ─── Status Commands ───

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':id/submit')
  submit(@Param('id') id: string, @Body('version') version: number, @CurrentUser() user: JwtPayload) {
    if (version === undefined) throw new BadRequestException('version is required');
    return this.listingsService.submitListing(id, user.sub, version);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':id/mark-sold')
  markSold(@Param('id') id: string, @Body('version') version: number, @CurrentUser() user: JwtPayload) {
    if (version === undefined) throw new BadRequestException('version is required');
    return this.listingsService.markListingSold(id, user.sub, version);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':id/archive')
  archive(@Param('id') id: string, @Body('version') version: number, @CurrentUser() user: JwtPayload) {
    if (version === undefined) throw new BadRequestException('version is required');
    return this.listingsService.archiveListing(id, user.sub, version);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':id/restore')
  restore(@Param('id') id: string, @Body('version') version: number, @CurrentUser() user: JwtPayload) {
    if (version === undefined) throw new BadRequestException('version is required');
    return this.listingsService.restoreListing(id, user.sub, version);
  }

  @Get('search/suggestions')
  async getSuggestions(@Query('q') q?: string) {
    if (!q || q.length < 2) return [];
    return this.listingsService.getSuggestions(q);
  }
}
