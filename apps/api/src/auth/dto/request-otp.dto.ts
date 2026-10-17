import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeDigits } from '../auth.validators';

export class RequestOtpDto {
  @Transform(({ value }) => (typeof value === 'string' ? normalizeDigits(value) : value))
  @IsString({ message: 'رقم الهاتف مطلوب' })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  phone!: string;
}
