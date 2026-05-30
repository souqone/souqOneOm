import {
  IsString, IsEnum, IsOptional, IsNumber, IsArray,
  IsBoolean, Min, Max, MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EmploymentType, SalaryPeriod, LicenseType, JobStatus,
} from '@prisma/client';

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  // M-6: jobType is immutable after creation — changing it would invalidate existing applications

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  salary?: number;

  @IsOptional()
  @IsEnum(SalaryPeriod)
  salaryPeriod?: SalaryPeriod;

  @IsOptional()
  @IsArray()
  @IsEnum(LicenseType, { each: true })
  licenseTypes?: LicenseType[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(18)
  minAge?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Max(70)
  maxAge?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vehicleTypes?: string[];

  @IsOptional()
  @IsBoolean()
  hasOwnVehicle?: boolean;

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
  contactEmail?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
