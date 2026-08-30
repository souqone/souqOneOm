import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto, AutocompleteQueryDto } from './dto/search-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * GET /api/search — Unified search across all entities.
   * Supports full-text, fuzzy, filters, sorting, pagination.
   */
  @Get()
  search(@Query() dto: SearchQueryDto) {
    return this.searchService.search(dto);
  }

  /**
   * GET /api/search/autocomplete — Fast autocomplete suggestions.
   */
  @Get('autocomplete')
  autocomplete(@Query() dto: AutocompleteQueryDto) {
    return this.searchService.autocomplete(dto.q, dto.limit);
  }

  /**
   * POST /api/search/reindex — Full re-sync from PostgreSQL.
   * Protected — requires authentication (admin use).
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('reindex')
  reindex() {
    return this.searchService.reindexAll();
  }
}
