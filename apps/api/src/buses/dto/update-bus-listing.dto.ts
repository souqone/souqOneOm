import {
  IsString, IsEnum, IsOptional, IsNumber, IsArray,
  IsBoolean, Min, MaxLength, MinLength, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  BusListingType, BusType, ContractType,
  FuelType, Transmission, ItemCondition, ListingStatus,
} from '@prisma/client';

export class UpdateBusListingDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsEnum(BusListingType)
  busListingType?: BusListingType;

  @IsOptional()
  @IsEnum(BusType)
  busType?: BusType;

  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1970)
  year?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @IsEnum(Transmission)
  transmission?: Transmission;

  @IsOptional()
  @IsEnum(ItemCondition)
  condition?: ItemCondition;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsString()
  plateNumber?: string;

  // ── Sale ──
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isPriceNegotiable?: boolean;

  // ── Contract (BUS_SALE_WITH_CONTRACT) ──
  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @IsOptional()
  @IsString()
  contractClient?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  contractMonthly?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  contractDuration?: number;

  @IsOptional()
  @IsDateString()
  contractExpiry?: string;

  // ── Rental (سعر استرشادي) ──
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  dailyPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  monthlyPrice?: number;

  @IsOptional()
  @IsBoolean()
  withDriver?: boolean;

  // ── Location ──
  @IsOptional()
  @IsString()
  governorate?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  // ── Contact ──
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  // ── Status (validated by state machine in service) ──
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
}
