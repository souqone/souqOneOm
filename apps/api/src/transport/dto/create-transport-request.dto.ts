import {
  IsString, IsEnum, IsOptional, IsNumber, IsBoolean,
  IsDateString, Min, MinLength, MinDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransportServiceType } from '@prisma/client';

export class CreateTransportRequestDto {
  @IsEnum(TransportServiceType)
  serviceType!: TransportServiceType;

  // From
  @IsString()
  fromGovernorate!: string;

  @IsOptional()
  @IsString()
  fromCity?: string;

  @IsString()
  @MinLength(5)
  fromAddress!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fromLat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fromLng?: number;

  // To
  @IsString()
  toGovernorate!: string;

  @IsOptional()
  @IsString()
  toCity?: string;

  @IsString()
  @MinLength(5)
  toAddress!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  toLat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  toLng?: number;

  // Cargo
  @IsString()
  @MinLength(5)
  cargoDescription!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weightTons?: number;

  @IsOptional()
  @IsBoolean()
  requiresHelper?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  // Timing
  @IsOptional()
  @IsDateString()
  @MinDate(new Date(), { message: 'scheduledAt يجب أن تكون في المستقبل' })
  scheduledAt?: string;

  @IsOptional()
  @IsBoolean()
  isFlexible?: boolean;

  // Budget
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  budgetMax?: number;
}
