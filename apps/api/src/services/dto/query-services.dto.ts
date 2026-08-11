import { IsOptional, IsString, IsEnum, IsNumberString, IsBoolean, IsArray, IsNumber } from 'class-validator';
import { ServiceType, ProviderType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class QueryServicesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @IsOptional()
  @IsEnum(ProviderType)
  providerType?: ProviderType;

  @IsOptional()
  @IsString()
  governorate?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isHomeService?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isOpenNow?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  radiusKm?: number;

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
