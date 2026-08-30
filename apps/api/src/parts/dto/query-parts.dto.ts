import { IsOptional, IsString, IsEnum, IsNumberString, IsBooleanString, IsIn, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PartCategory, PartCondition } from '@prisma/client';

export class QueryPartsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PartCategory)
  partCategory?: PartCategory;

  @IsOptional()
  @IsEnum(PartCondition)
  condition?: PartCondition;

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
  @IsString()
  partNumber?: string;

  @IsOptional()
  @IsBooleanString()
  isOriginal?: string;

  @IsOptional()
  @IsBooleanString()
  isScrap?: string;

  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @IsOptional()
  @IsNumberString()
  maxPrice?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  hasWarranty?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['CAR', 'BUS', 'EQUIPMENT'])
  compatibleVehicleType?: string;
}
