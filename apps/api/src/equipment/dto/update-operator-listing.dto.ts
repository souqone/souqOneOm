import {
  IsString, IsOptional, IsInt, IsBoolean,
  IsNumber, IsArray, Min, MinLength, IsPositive,
} from 'class-validator';

/**
 * Whitelist of updatable fields — excludes userId, status, slug, viewCount.
 */
export class UpdateOperatorListingDto {
  @IsOptional() @IsString() @MinLength(5, { message: 'العنوان يجب أن يكون 5 أحرف على الأقل' })
  title?: string;

  @IsOptional() @IsString() @MinLength(10, { message: 'الوصف يجب أن يكون 10 أحرف على الأقل' })
  description?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  specializations?: string[];

  @IsOptional() @IsInt() @Min(0)
  experienceYears?: number;

  @IsOptional() @IsArray() @IsString({ each: true })
  equipmentTypes?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  certifications?: string[];

  @IsOptional() @IsNumber() @Min(0)
  dailyRate?: number;

  @IsOptional() @IsNumber() @Min(0)
  hourlyRate?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsBoolean()
  isPriceNegotiable?: boolean;

  @IsOptional()
  @IsInt()
  @IsPositive()
  governorateId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  wilayaId?: number;

  @IsOptional() @IsNumber()
  latitude?: number;

  @IsOptional() @IsNumber()
  longitude?: number;

  @IsOptional() @IsString()
  contactPhone?: string;

  @IsOptional() @IsString()
  whatsapp?: string;
}
