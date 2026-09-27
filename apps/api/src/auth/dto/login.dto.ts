import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email!: string;

  @IsString({ message: 'كلمة المرور يجب أن تكون نصية' })
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون ٦ أحرف على الأقل' })
  password!: string;
}
