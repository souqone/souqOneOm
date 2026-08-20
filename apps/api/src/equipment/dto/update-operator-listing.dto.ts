import {
  IsString, IsOptional, IsEnum, IsInt, IsBoolean,
  IsNumber, IsArray, Min, MinLength, MaxLength, IsPositive, ArrayMinSize
} from 'class-validator';

export class UpdateOperatorListingDto {
  @IsOptional()
  @IsString() 
  @MinLength(5)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString() 
  @MinLength(10)
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(['DRIVER', 'OPERATOR', 'TECHNICIAN', 'MAINTENANCE'])
  operatorType?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  specializations?: string[];

  @IsOptional()
  @IsInt() @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsArray() 
  @ArrayMinSize(1) 
  @IsString({ each: true })
  equipmentTypes?: string[];

  @IsOptional()
  @IsArray() 
  @ArrayMinSize(1) 
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsNumber() @Min(1)
  dailyRate?: number;

  @IsOptional()
  @IsNumber() @Min(1)
  hourlyRate?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsBoolean()
  isPriceNegotiable?: boolean;

  @IsOptional()
  @IsInt()
  @IsPositive()
  governorateId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  wilayaId?: number;

  @IsOptional() @IsNumber()
  latitude?: number;

  @IsOptional() @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString() @MinLength(8)
  contactPhone?: string;

  @IsOptional()
  @IsString() @MinLength(8)
  whatsapp?: string;
}
