import { IsString, MinLength, Matches } from 'class-validator';
import { MaxBytes } from '../../auth/auth.validators';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'كلمة المرور الحالية مطلوبة' })
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'كلمة المرور الجديدة يجب أن تكون ٨ أحرف على الأقل' })
  @MaxBytes(72, { message: 'كلمة المرور طويلة جداً' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, { message: 'كلمة المرور يجب أن تحتوي على حرف كبير ورقم على الأقل' })
  newPassword!: string;
}
