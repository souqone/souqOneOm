import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { BusListingType, BusType } from '@prisma/client';

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
  minCapacity?: string;

  @IsOptional()
  @IsNumberString()
  maxCapacity?: string;

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
}
