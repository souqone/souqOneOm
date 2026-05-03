import { IsString, IsOptional, IsArray, IsEnum, IsBoolean, MinLength } from 'class-validator';
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

  @IsOptional()
  @IsString()
  governorate?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
