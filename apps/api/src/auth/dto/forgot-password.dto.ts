import { Transform } from 'class-transformer';
import { IsNormalizedEmail, normalizeEmail } from '../auth.validators';

export class ForgotPasswordDto {
  @Transform(({ value }) => (typeof value === 'string' ? normalizeEmail(value) : value))
  @IsNormalizedEmail({ message: 'البريد الإلكتروني غير صالح' })
  email!: string;
}
