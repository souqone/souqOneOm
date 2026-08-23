import { IsString, IsInt, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, Min, Max, MaxLength, IsPositive, ArrayMaxSize, IsNotEmpty, IsLatitude, IsLongitude } from 'class-validator';
import { FuelType, Transmission, ItemCondition, ListingType } from '@prisma/client';

export class CreateListingDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  description!: string;

  @IsInt()
  @Min(1900)
  @Max(2030)
  year!: number;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsEnum(FuelType, { message: 'نوع الوقود غير صالح' })
  fuelType?: FuelType;

  @IsOptional()
  @IsEnum(Transmission, { message: 'نوع ناقل الحركة غير صالح' })
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
  @IsEnum(ItemCondition, { message: 'حالة السيارة غير صالحة' })
  condition?: ItemCondition;

  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  // سعر الإيجار الاسترشادي
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPrice?: number;

  @IsOptional()
  @IsBoolean()
  withDriver?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minRentalDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  kmLimitPerDay?: number;

  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @IsOptional()
  @IsBoolean()
  deliveryAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  insuranceIncluded?: boolean;

  @IsInt()
  @IsPositive()
  governorateId!: number;

  @IsInt()
  @IsPositive()
  wilayaId!: number;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsString()
  @IsNotEmpty()
  brandId!: string;

  @IsString()
  @IsNotEmpty()
  carModelId!: string;

  @IsOptional()
  @IsString()
  carTrimId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20, { message: 'لا يمكن تجاوز 20 صورة' })
  images?: string[];
}
