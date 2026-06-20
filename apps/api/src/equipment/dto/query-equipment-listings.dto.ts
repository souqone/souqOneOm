import { IsOptional, IsString, IsEnum, IsInt, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryEquipmentListingsDto {
  @IsOptional() @IsString()
  equipmentType?: string;

  @IsOptional() @IsEnum(['EQUIPMENT_SALE', 'EQUIPMENT_RENT', 'EQUIPMENT_WANTED'])
  listingType?: string;

  @IsOptional() @IsString()
  governorate?: string;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  sortBy?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number;

  @IsOptional() @IsString()
  userId?: string;

  // ─── Rich filters ───────────────────────────────────────────────────────────

  /** Filter by item condition: NEW | USED | LIKE_NEW | GOOD | FAIR | POOR */
  @IsOptional() @IsEnum(['NEW', 'USED', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'])
  condition?: string;

  /** Minimum price (inclusive). For sale listings: sale price; for rent: daily price. */
  @IsOptional() @Type(() => Number) @IsNumber()  @Min(0)
  minPrice?: number;

  /** Maximum price (inclusive). For sale listings: sale price; for rent: daily price. */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxPrice?: number;

  /** Filter by manufacturer / brand (case-insensitive exact match). */
  @IsOptional() @IsString()
  make?: string;

  /** Filter by model name (case-insensitive exact match). */
  @IsOptional() @IsString()
  model?: string;

  /** Earliest manufacture year (inclusive), e.g. 2015 */
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(2100)
  yearMin?: number;

  /** Latest manufacture year (inclusive), e.g. 2023 */
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) @Max(2100)
  yearMax?: number;

  /** Maximum hours used (inclusive). Only equipment at or below this value is returned. */
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  hoursUsedMax?: number;
}
