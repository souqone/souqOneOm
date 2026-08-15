import { IsOptional, IsString, IsEnum, IsInt, Min, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryOperatorListingsDto {
  @IsOptional() @IsEnum(['DRIVER', 'OPERATOR', 'TECHNICIAN', 'MAINTENANCE'])
  operatorType?: string;

  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  governorateId?: number;

  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  wilayaId?: number;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  sortBy?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number;

  @IsOptional() @IsString()
  userId?: string;
}
