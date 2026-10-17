import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeDigits } from '../auth.validators';

export class VerifyOtpDto {
  @Transform(({ value }) => (typeof value === 'string' ? normalizeDigits(value) : value))
  @IsString({ message: 'رقم الهاتف مطلوب' })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  phone!: string;

  @Transform(({ value }) => (typeof value === 'string' ? normalizeDigits(value).trim() : value))
  @IsString({ message: 'رمز التحقق مطلوب' })
  @Matches(/^\d{6}$/, { message: 'رمز التحقق يجب أن يتكون من ٦ أرقام' })
  code!: string;
}
