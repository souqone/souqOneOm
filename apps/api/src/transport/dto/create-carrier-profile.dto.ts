import { IsString, IsOptional, IsArray, IsEnum, MinLength, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
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

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  governorateId!: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  wilayaId!: number;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;
}
