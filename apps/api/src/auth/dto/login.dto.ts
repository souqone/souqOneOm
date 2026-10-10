import { IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsNormalizedEmail, normalizeEmail } from '../auth.validators';

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? normalizeEmail(value) : value))
  @IsNormalizedEmail({ message: 'البريد الإلكتروني غير صالح' })
  email!: string;

  @IsString({ message: 'كلمة المرور يجب أن تكون نصية' })
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون ٦ أحرف على الأقل' })
  password!: string;
}
