import { IsEmail, IsInt, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email!: string;

  @IsString({ message: 'اسم المستخدم يجب أن يكون نصياً' })
  @MinLength(3, { message: 'اسم المستخدم يجب أن يكون ٣ أحرف على الأقل' })
  @MaxLength(30, { message: 'اسم المستخدم يجب ألا يتجاوز ٣٠ حرفاً' })
  username!: string;

  @IsString({ message: 'كلمة المرور يجب أن تكون نصية' })
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, { message: 'كلمة المرور يجب أن تحتوي على حرف كبير ورقم على الأقل' })
  password!: string;

  @IsOptional()
  @IsString({ message: 'الاسم المعروض يجب أن يكون نصياً' })
  @MaxLength(50, { message: 'الاسم المعروض يجب ألا يتجاوز ٥٠ حرفاً' })
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
