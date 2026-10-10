import { IsInt, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  IsNormalizedEmail,
  normalizeEmail,
  MaxBytes,
  IsNotReservedUsername,
  cleanDisplayName,
} from '../auth.validators';

export class SignupDto {
  @Transform(({ value }) => (typeof value === 'string' ? normalizeEmail(value) : value))
  @IsNormalizedEmail({ message: 'البريد الإلكتروني غير صالح' })
  email!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString({ message: 'اسم المستخدم يجب أن يكون نصياً' })
  @Matches(/^[a-z0-9_.]{3,30}$/, {
    message: 'اسم المستخدم: من 3 إلى 30 حرفاً إنجليزياً صغيراً أو أرقاماً أو _ أو .',
  })
  @IsNotReservedUsername({ message: 'اسم المستخدم غير متاح' })
  username!: string;

  @IsString({ message: 'كلمة المرور يجب أن تكون نصية' })
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل' })
  @MaxBytes(72, { message: 'كلمة المرور طويلة جداً' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, { message: 'كلمة المرور يجب أن تحتوي على حرف كبير ورقم على الأقل' })
  password!: string;

  @IsOptional()
  @Transform(({ value }) => cleanDisplayName(value))
  @IsString({ message: 'الاسم المعروض يجب أن يكون نصياً' })
  @MinLength(2, { message: 'الاسم المعروض يجب ألا يقل عن حرفين' })
  @MaxLength(50, { message: 'الاسم المعروض يجب ألا يتجاوز ٥٠ حرفاً' })
  @Matches(/^[^<>]*$/, { message: 'الاسم المعروض لا يجب أن يحتوي على < أو >' })
  displayName?: string;

  @IsOptional()
  @IsString({ message: 'رقم الهاتف يجب أن يكون نصياً' })
  @MaxLength(20, { message: 'رقم الهاتف يجب ألا يتجاوز ٢٠ رقماً' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'الدولة يجب أن تكون نصية' })
  country?: string;

  @IsOptional()
  @IsString({ message: 'المحافظة يجب أن تكون نصية' })
  governorate?: string;

  @IsOptional()
  @IsString({ message: 'المدينة أو الولاية يجب أن تكون نصية' })
  city?: string;

  @IsOptional()
  @IsInt({ message: 'معرف المحافظة يجب أن يكون رقماً' })
  governorateId?: number;

  @IsOptional()
  @IsInt({ message: 'معرف الولاية يجب أن يكون رقماً' })
  wilayaId?: number;
}
