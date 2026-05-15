import { IsString, IsInt, IsNumber, IsOptional, IsEnum, IsBoolean, IsDateString, IsArray, Min, Max, MaxLength } from 'class-validator';
import { FuelType, Transmission, ItemCondition, ListingStatus, ListingType, CancellationPolicy } from '@prisma/client';

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  make?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2030)
  year?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @IsEnum(Transmission)
  transmission?: Transmission;

  @IsOptional()
  @IsString()
  bodyType?: string;

  @IsOptional()
  @IsString()
  exteriorColor?: string;

  @IsOptional()
  @IsString()
  interior?: string;

  @IsOptional()
  @IsString()
  engineSize?: string;

  @IsOptional()
  @IsInt()
  horsepower?: number;

  @IsOptional()
  @IsInt()
  doors?: number;

  @IsOptional()
  @IsInt()
  seats?: number;

  @IsOptional()
  @IsString()
  driveType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isPriceNegotiable?: boolean;

  @IsOptional()
  @IsEnum(ItemCondition)
  condition?: ItemCondition;

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weeklyPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minRentalDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  kmLimitPerDay?: number;

  @IsOptional()
  @IsBoolean()
  withDriver?: boolean;

  @IsOptional()
  @IsBoolean()
  deliveryAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  insuranceIncluded?: boolean;

  @IsOptional()
  @IsEnum(CancellationPolicy)
  cancellationPolicy?: CancellationPolicy;

  @IsOptional()
  @IsDateString()
  availableFrom?: string;

  @IsOptional()
  @IsDateString()
  availableTo?: string;

  @IsOptional()
  @IsString()
  governorate?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  carModelId?: string;

  @IsOptional()
  @IsString()
  carTrimId?: string;
}
