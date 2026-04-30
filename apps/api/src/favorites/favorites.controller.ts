import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { FavoritesService } from './favorites.service';

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  // Generic toggle: POST /favorites/:entityType/:entityId
  @Post(':entityType/:entityId')
  toggle(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.favoritesService.toggle(entityType, entityId, user.sub);
  }

  // Backward compat: POST /favorites/:listingId (assumes LISTING)
  @Post(':listingId')
  toggleListing(
    @Param('listingId') listingId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.favoritesService.toggle('LISTING', listingId, user.sub);
  }

  @Get()
  getUserFavorites(
    @CurrentUser() user: JwtPayload,
    @Query('type') entityType?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.favoritesService.getUserFavorites(
      user.sub,
      entityType,
      page,
      limit,
    );
  }

  // Generic check: GET /favorites/check/:entityType/:entityId
  @Get('check/:entityType/:entityId')
  checkFavorite(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.favoritesService.checkFavorite(entityType, entityId, user.sub);
  }

  // Backward compat: GET /favorites/check/:listingId (assumes LISTING)
  @Get('check/:listingId')
  checkFavoriteListing(
    @Param('listingId') listingId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.favoritesService.checkFavorite('LISTING', listingId, user.sub);
  }

  // Get all favorite IDs for the current user (for bulk checking)
  @Get('ids')
  getFavoriteIds(
    @CurrentUser() user: JwtPayload,
    @Query('type') entityType?: string,
  ) {
    return this.favoritesService.getUserFavoriteIds(user.sub, entityType);
  }
}
