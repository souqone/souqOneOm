import { IsString, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsNormalizedEmail, normalizeEmail, normalizeDigits, MaxBytes } from '../auth.validators';

export class ResetPasswordDto {
  @Transform(({ value }) => (typeof value === 'string' ? normalizeEmail(value) : value))
  @IsNormalizedEmail({ message: 'البريد الإلكتروني غير صالح' })
  email!: string;

  @Transform(({ value }) => normalizeDigits(value))
  @IsString({ message: 'رمز التحقق مطلوب' })
  @Matches(/^\d{6}$/, { message: 'رمز التحقق يجب أن يكون 6 أرقام' })
  code!: string;

  @IsString({ message: 'كلمة المرور يجب أن تكون نصية' })
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل' })
  @MaxBytes(72, { message: 'كلمة المرور طويلة جداً' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, { message: 'كلمة المرور يجب أن تحتوي على حرف كبير ورقم على الأقل' })
  newPassword!: string;
}
