import { IsInt, IsString, IsEnum, IsOptional, IsNumber, IsArray,
  IsBoolean, Min, MaxLength, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType, ProviderType } from '@prisma/client';

export class CreateServiceDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  description!: string;

  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  @IsEnum(ProviderType)
  providerType!: ProviderType;

  @IsString()
  @MaxLength(100)
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

  @IsInt()
  @IsPositive()
  governorateId!: number;

  @IsInt()
  @IsPositive()
  wilayaId!: number;

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
