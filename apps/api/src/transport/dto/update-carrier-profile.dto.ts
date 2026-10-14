import { IsString, IsOptional, IsArray, IsEnum, IsBoolean, MinLength, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleType, TransportServiceType } from '@prisma/client';

export class UpdateCarrierProfileDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(VehicleType, { each: true })
  vehicleTypes?: VehicleType[];

  @IsOptional()
  @IsArray()
  @IsEnum(TransportServiceType, { each: true })
  serviceTypes?: TransportServiceType[];

  /** @deprecated accepted from legacy clients, silently discarded — do not persist */
  @IsOptional()
  @IsString()
  contactPhone?: string;

  /** @deprecated accepted from legacy clients, silently discarded — do not persist */
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  governorateId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  wilayaId?: number;
}
