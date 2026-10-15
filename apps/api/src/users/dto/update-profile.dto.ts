import {
  ValidateIf,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsInt,
  IsPositive,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { cleanDisplayName } from '../../auth/auth.validators';
import { IsValidPhone } from '../../common/validators/phone.validator';

export class UpdateProfileDto {
  @ValidateIf((_o, v) => v !== undefined)
  @Transform(({ value }) => cleanDisplayName(value))
  @IsString({ message: 'الاسم المعروض يجب أن يكون نصاً' })
  @MinLength(2, { message: 'الاسم المعروض يجب ألا يقل عن حرفين' })
  @MaxLength(50, { message: 'الاسم المعروض يجب ألا يتجاوز 50 حرفاً' })
  @Matches(/^[^<>]*$/, { message: 'الاسم المعروض لا يجب أن يحتوي على < أو >' })
  displayName?: string;

  @ValidateIf((_o, v) => v !== undefined && v !== null)
  @IsString({ message: 'النبذة يجب أن تكون نصاً' })
  @MaxLength(500, { message: 'النبذة لا يجب أن تتجاوز 500 حرف' })
  bio?: string | null;

  @ValidateIf((_o, v) => v !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب ولا يمكن حذفه' })
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصاً' })
  @MaxLength(20, { message: 'رقم الهاتف يجب ألا يتجاوز 20 حرفاً' })
  @IsValidPhone({ message: 'رقم الهاتف غير صالح' })
  phone?: string;

  @ValidateIf((_o, v) => v !== undefined && v !== null)
  @IsString({ message: 'رمز الدولة يجب أن يكون نصاً' })
  @MaxLength(10, { message: 'رمز الدولة يجب ألا يتجاوز 10 أحرف' })
  country?: string | null;

  @ValidateIf((_o, v) => v !== undefined)
  @IsInt({ message: 'المحافظة غير صالحة' })
  @IsPositive({ message: 'المحافظة غير صالحة' })
  governorateId?: number;

  @ValidateIf((_o, v) => v !== undefined)
  @IsInt({ message: 'الولاية غير صالحة' })
  @IsPositive({ message: 'الولاية غير صالحة' })
  wilayaId?: number;

  @ValidateIf((_o, v) => v !== undefined && v !== null)
  @IsNumber({}, { message: 'خط العرض يجب أن يكون رقماً' })
  @Min(-90, { message: 'خط العرض يجب أن يكون بين -90 و 90' })
  @Max(90, { message: 'خط العرض يجب أن يكون بين -90 و 90' })
  latitude?: number | null;

  @ValidateIf((_o, v) => v !== undefined && v !== null)
  @IsNumber({}, { message: 'خط الطول يجب أن يكون رقماً' })
  @Min(-180, { message: 'خط الطول يجب أن يكون بين -180 و 180' })
  @Max(180, { message: 'خط الطول يجب أن يكون بين -180 و 180' })
  longitude?: number | null;

  @ValidateIf((_o, v) => v !== undefined && v !== null && v !== '')
  @IsString({ message: 'رابط الصورة الشخصية يجب أن يكون نصاً' })
  @MaxLength(500, { message: 'رابط الصورة الشخصية لا يجب أن يتجاوز 500 حرف' })
  avatarUrl?: string | null;
}
