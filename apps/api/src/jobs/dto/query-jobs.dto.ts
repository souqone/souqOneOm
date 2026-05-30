import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { JobType, EmploymentType, JobStatus } from '@prisma/client';

export class QueryJobsDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsString()
  licenseType?: string;

  @IsOptional()
  @IsString()
  governorate?: string;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: string;

  @IsOptional()
  @IsNumberString()
  minSalary?: string;

  @IsOptional()
  @IsNumberString()
  maxSalary?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
