import {
  IsString, IsEnum, IsOptional, IsNumber, IsArray,
  IsBoolean, Min, MaxLength, MinLength, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  BusListingType, BusType, ContractType,
  FuelType, Transmission, ItemCondition,
} from '@prisma/client';

export class CreateBusListingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsEnum(BusListingType)
  busListingType!: BusListingType;

  @IsEnum(BusType)
  busType!: BusType;

  @IsString()
  make!: string;

  @IsString()
  model!: string;

  @IsOptional()
  @IsString()
  manufacturerId?: string;

  @IsOptional()
  @IsString()
  modelId?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1970)
  year!: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  capacity!: number;

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

  // ── Contract (sale with contract) ──
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

  // ── Rental ──
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
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  minRentalDays?: number;

  @IsOptional()
  @IsBoolean()
  withDriver?: boolean;

  @IsOptional()
  @IsBoolean()
  deliveryAvailable?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  kmLimitPerDay?: number;

  @IsOptional()
  @IsBoolean()
  insuranceIncluded?: boolean;

  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @IsOptional()
  @IsDateString()
  availableFrom?: string;

  @IsOptional()
  @IsDateString()
  availableTo?: string;

  // ── Contract request ──
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  requestPassengers?: number;

  @IsOptional()
  @IsString()
  requestRoute?: string;

  @IsOptional()
  @IsString()
  requestSchedule?: string;

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
}
