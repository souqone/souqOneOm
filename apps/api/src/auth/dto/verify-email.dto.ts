import { Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeDigits } from '../auth.validators';

export class VerifyEmailDto {
  @Transform(({ value }) => normalizeDigits(value))
  @Matches(/^\d{6}$/, { message: 'رمز التحقق يجب أن يكون 6 أرقام' })
  code!: string;
}
