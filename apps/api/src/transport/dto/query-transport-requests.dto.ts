import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { TransportServiceType, TransportRequestStatus } from '@prisma/client';

export class QueryTransportRequestsDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsEnum(TransportServiceType)
  serviceType?: TransportServiceType;

  @IsOptional()
  @IsEnum(TransportRequestStatus)
  status?: TransportRequestStatus;

  @IsOptional()
  @IsString()
  fromGovernorate?: string;

  @IsOptional()
  @IsString()
  fromCity?: string;

  @IsOptional()
  @IsString()
  toGovernorate?: string;

  @IsOptional()
  @IsString()
  toCity?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
