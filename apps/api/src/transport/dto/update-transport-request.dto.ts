import {
  IsString, IsEnum, IsOptional, IsNumber, IsBoolean,
  IsDateString, Min, MinLength,
  registerDecorator, ValidationOptions, ValidationArguments,
} from 'class-validator';

function IsBudgetRangeValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBudgetRangeValid',
      target: (object as any).constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          if (obj.budgetMin != null && value != null) {
            return Number(obj.budgetMin) <= Number(value);
          }
          return true;
        },
        defaultMessage() {
          return 'الحد الأقصى للميزانية يجب أن يكون أكبر من أو يساوي الحد الأدنى';
        },
      },
    });
  };
}
import { Type } from 'class-transformer';
import { TransportServiceType } from '@prisma/client';

export class UpdateTransportRequestDto {
  @IsOptional()
  @IsEnum(TransportServiceType)
  serviceType?: TransportServiceType;

  @IsOptional()
  @IsString()
  fromGovernorate?: string;

  @IsOptional()
  @IsString()
  fromCity?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  fromAddress?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fromLat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fromLng?: number;

  @IsOptional()
  @IsString()
  toGovernorate?: string;

  @IsOptional()
  @IsString()
  toCity?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  toAddress?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  toLat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  toLng?: number;

  @IsOptional()
  @IsString()
  @MinLength(5)
  cargoDescription?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weightTons?: number;

  @IsOptional()
  @IsBoolean()
  requiresHelper?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsBoolean()
  isFlexible?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'الحد الأدنى للميزانية يجب أن يكون أكبر من 0' })
  @Type(() => Number)
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'الحد الأقصى للميزانية يجب أن يكون أكبر من 0' })
  @IsBudgetRangeValid()
  @Type(() => Number)
  budgetMax?: number;
}
