import {
  IsInt,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  Min,
  MaxLength,
  IsPositive,
  ArrayMinSize,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType, ProviderType } from '@prisma/client';

@ValidatorConstraint({ name: 'isGreaterThanOrEqualTo', async: false })
export class IsGreaterThanOrEqualToConstraint implements ValidatorConstraintInterface {
  validate(propertyValue: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    if (propertyValue === undefined || propertyValue === null) {
      return true;
    }
    if (relatedValue === undefined || relatedValue === null) {
      return true;
    }
    return Number(propertyValue) >= Number(relatedValue);
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `${args.property} must be greater than or equal to ${relatedPropertyName}`;
  }
}

export function IsGreaterThanOrEqualTo(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsGreaterThanOrEqualToConstraint,
    });
  };
}

export class CreateServiceDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  description!: string;

  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  @IsEnum(ProviderType)
  providerType!: ProviderType;

  @IsString()
  @MaxLength(100)
  providerName!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @IsNumber({}, { message: 'السعر الأدنى يجب أن يكون رقمًا' })
  @Type(() => Number)
  @Min(0, { message: 'السعر الأدنى يجب أن يكون 0 أو أكثر' })
  priceFrom!: number;

  @IsOptional()
  @IsNumber({}, { message: 'السعر الأعلى يجب أن يكون رقمًا' })
  @Type(() => Number)
  @Min(0, { message: 'السعر الأعلى يجب أن يكون 0 أو أكثر' })
  @IsGreaterThanOrEqualTo('priceFrom', {
    message: 'السعر الأعلى يجب أن يكون أكبر من أو يساوي السعر الأدنى (priceTo must be >= priceFrom)',
  })
  priceTo?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isHomeService?: boolean;

  @IsOptional()
  @IsString()
  workingHoursOpen?: string;

  @IsOptional()
  @IsString()
  workingHoursClose?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workingDays?: string[];

  @IsInt()
  @IsPositive()
  governorateId!: number;

  @IsInt()
  @IsPositive()
  wilayaId!: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsArray({ message: 'الصور يجب أن تكون مصفوفة' })
  @ArrayMinSize(1, { message: 'يجب إضافة صورة واحدة على الأقل' })
  @IsString({ each: true, message: 'كل صورة يجب أن تكون رابط نصي صحيح' })
  images!: string[];
}
