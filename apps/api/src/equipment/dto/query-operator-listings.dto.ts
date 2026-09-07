import { IsOptional, IsString, IsEnum, IsInt, IsNumber, Min, IsPositive, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryOperatorListingsDto {
  @IsOptional() @IsEnum(['DRIVER', 'OPERATOR', 'TECHNICIAN', 'MAINTENANCE'])
  operatorType?: string;

  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  governorateId?: number;

  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  wilayaId?: number;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['createdAt', 'dailyRate', 'hourlyRate', 'experienceYears', 'viewCount'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number;

  @IsOptional() @IsString()
  userId?: string;

  // ─── Rate & Experience Filters ───────────────────────────────────────────────

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  minDailyRate?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxDailyRate?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  minHourlyRate?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxHourlyRate?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  minExperienceYears?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  maxExperienceYears?: number;
}
