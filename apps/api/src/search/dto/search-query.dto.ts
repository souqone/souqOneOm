import { IsOptional, IsString, IsInt, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
  /** Search query text */
  @IsOptional()
  @IsString()
  q?: string;

  /** Filter by entity type */
  @IsOptional()
  @IsIn(['listings', 'parts', 'services', 'jobs', 'buses', 'equipment'])
  entityType?: string;

  /** Minimum price filter */
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  /** Maximum price filter */
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  /** Category / type filter (e.g. partCategory, serviceType) */
  @IsOptional()
  @IsString()
  category?: string;

  /** City filter */
  @IsOptional()
  @IsString()
  city?: string;

  /** Governorate filter */
  @IsOptional()
  @IsString()
  governorate?: string;

  /** Make filter (for listings/parts) */
  @IsOptional()
  @IsString()
  make?: string;

  /** Condition filter (for listings/parts) */
  @IsOptional()
  @IsString()
  condition?: string;

  /** Listing type filter (SALE / RENTAL) */
  @IsOptional()
  @IsIn(['SALE', 'RENTAL'])
  listingType?: string;

  /** Sort: price:asc, price:desc, newest */
  @IsOptional()
  @IsIn(['price:asc', 'price:desc', 'newest'])
  sortBy?: string = 'newest';

  /** Page number (1-indexed) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** Results per page */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export class AutocompleteQueryDto {
  /** Search query text */
  @IsString()
  q!: string;

  /** Max suggestions to return */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 8;
}
