import { IsInt, IsString, IsEnum, IsOptional, IsNumber, IsArray,
  IsBoolean, Min, MaxLength, MinLength, } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType, ProviderType } from '@prisma/client';

export class CreateServiceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  @IsEnum(ProviderType)
  providerType!: ProviderType;

  @IsString()
  providerName!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  priceFrom?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  priceTo?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isHomeService?: boolean;

  @IsOptional()
  @IsString()
  workingHoursOpen?: string;

  @IsOptional()
  @IsString()
  workingHoursClose?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workingDays?: string[];

  @IsString()
  governorate!: string;

  @IsOptional()
  @IsInt()
  governorateId?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsInt()
  wilayaId?: number;

  @IsOptional()
  @IsString()
  address?: string;

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
  @IsString()
  website?: string;
}
