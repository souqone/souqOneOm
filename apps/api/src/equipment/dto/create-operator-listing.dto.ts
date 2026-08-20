import {
  IsString, IsOptional, IsEnum, IsInt, IsBoolean,
  IsNumber, IsArray, Min, MinLength, MaxLength, IsPositive, ArrayMinSize, ValidateIf
} from 'class-validator';

export class CreateOperatorListingDto {
  @IsString() 
  @MinLength(5, { message: 'العنوان يجب أن يكون 5 أحرف على الأقل' })
  @MaxLength(100, { message: 'العنوان يجب ألا يتجاوز 100 حرف' })
  title!: string;

  @IsString() 
  @MinLength(10, { message: 'الوصف يجب أن يكون 10 أحرف على الأقل' })
  @MaxLength(2000, { message: 'الوصف يجب ألا يتجاوز 2000 حرف' })
  description!: string;

  @IsEnum(['DRIVER', 'OPERATOR', 'TECHNICIAN', 'MAINTENANCE'], { message: 'نوع الخدمة غير صالح' })
  operatorType!: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  specializations?: string[];

  @IsInt() @Min(0)
  experienceYears!: number;

  @IsArray() 
  @ArrayMinSize(1) 
  @IsString({ each: true })
  equipmentTypes!: string[];

  @IsArray() 
  @ArrayMinSize(1) 
  @IsString({ each: true })
  certifications!: string[];

  @ValidateIf((o: any) => !o.hourlyRate)
  @IsNumber() @Min(1)
  dailyRate?: number;

  @ValidateIf((o: any) => !o.dailyRate)
  @IsNumber() @Min(1)
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

  @IsString() @MinLength(8)
  contactPhone!: string;

  @IsOptional() @IsString() @MinLength(8)
  whatsapp?: string;
}
