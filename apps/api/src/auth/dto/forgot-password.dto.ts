import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email!: string;
}
