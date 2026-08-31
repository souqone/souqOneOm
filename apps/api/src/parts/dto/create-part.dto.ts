import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, Min, MaxLength, MinLength, IsInt, IsPositive, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { PartCategory, PartCondition } from '@prisma/client';

export class CreatePartDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsEnum(PartCategory)
  partCategory!: PartCategory;

  @IsOptional()
  @IsEnum(PartCondition)
  condition?: PartCondition;

  @IsOptional()
  @IsString()
  partNumber?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compatibleMakes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compatibleModels?: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1900)
  yearFrom?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  yearTo?: number;

  @IsOptional()
  @IsBoolean()
  isOriginal?: boolean;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isPriceNegotiable?: boolean;

  @IsInt()
  @IsPositive()
  governorateId!: number;

  @IsInt()
  @IsPositive()
  wilayaId!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  hasWarranty?: boolean;

  @IsOptional()
  @IsIn(['ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'ONE_YEAR', 'TWO_YEARS'])
  warrantyDuration?: string;

  @IsOptional()
  @IsIn(['ONE', 'TWO_TO_FIVE', 'SIX_TO_TEN', 'ELEVEN_TO_TWENTY', 'TWENTY_TO_FIFTY', 'FIFTY_TO_HUNDRED', 'OVER_HUNDRED'])
  quantity?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(['CAR', 'BUS', 'EQUIPMENT'], { each: true })
  compatibleVehicleTypes?: string[];
}
