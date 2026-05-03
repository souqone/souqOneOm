import { IsString, IsOptional, IsArray, IsEnum, MinLength } from 'class-validator';
import { VehicleType, TransportServiceType } from '@prisma/client';

export class CreateCarrierProfileDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  bio?: string;

  @IsArray()
  @IsEnum(VehicleType, { each: true })
  vehicleTypes!: VehicleType[];

  @IsArray()
  @IsEnum(TransportServiceType, { each: true })
  serviceTypes!: TransportServiceType[];

  @IsString()
  governorate!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;
}
