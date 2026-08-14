import {
  IsString, IsOptional, IsEnum, IsInt, IsBoolean,
  IsNumber, IsArray, Min, MinLength, IsPositive,
} from 'class-validator';

export class CreateOperatorListingDto {
  @IsString() @MinLength(5, { message: 'العنوان يجب أن يكون 5 أحرف على الأقل' })
  title!: string;

  @IsString() @MinLength(10, { message: 'الوصف يجب أن يكون 10 أحرف على الأقل' })
  description!: string;

  @IsEnum(['DRIVER', 'OPERATOR', 'TECHNICIAN', 'MAINTENANCE'], { message: 'نوع الخدمة غير صالح' })
  operatorType!: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  specializations?: string[];

  @IsOptional() @IsInt() @Min(0)
  experienceYears?: number;

  @IsOptional() @IsArray() @IsString({ each: true })
  equipmentTypes?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  certifications?: string[];

  @IsOptional() @IsNumber() @Min(0)
  dailyRate?: number;

  @IsOptional() @IsNumber() @Min(0)
  hourlyRate?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsBoolean()
  isPriceNegotiable?: boolean;

  @IsInt()
  @IsPositive()
  governorateId!: number;

  @IsInt()
  @IsPositive()
  wilayaId!: number;

  @IsOptional() @IsNumber()
  latitude?: number;

  @IsOptional() @IsNumber()
  longitude?: number;

  @IsOptional() @IsString()
  contactPhone?: string;

  @IsOptional() @IsString()
  whatsapp?: string;
}
