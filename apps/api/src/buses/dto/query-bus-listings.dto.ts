import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { BusListingType, BusType, ItemCondition, Transmission } from '@prisma/client';

export class QueryBusListingsDto {
  @IsOptional()
  @IsString()
  search?: string;

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
  @IsNumberString()
  governorateId?: string;

  @IsOptional()
  @IsNumberString()
  wilayaId?: string;

  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @IsOptional()
  @IsNumberString()
  maxPrice?: string;

  @IsOptional()
  @IsNumberString()
  priceMin?: string;

  @IsOptional()
  @IsNumberString()
  priceMax?: string;

  @IsOptional()
  @IsNumberString()
  minCapacity?: string;

  @IsOptional()
  @IsNumberString()
  maxCapacity?: string;

  @IsOptional()
  @IsNumberString()
  capacityMin?: string;

  @IsOptional()
  @IsNumberString()
  capacityMax?: string;

  @IsOptional()
  @IsString()
  sort?: string; // newest | price_asc | price_desc

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  isPremium?: string;

  @IsOptional()
  @IsEnum(ItemCondition)
  condition?: ItemCondition;

  @IsOptional()
  @IsEnum(Transmission)
  transmission?: Transmission;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsNumberString()
  yearMin?: string;

  @IsOptional()
  @IsNumberString()
  yearMax?: string;
}
