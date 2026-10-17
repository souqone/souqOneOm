import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyPhoneDto {
  @IsNotEmpty({ message: 'رمز التحقق مطلوب' })
  @IsString({ message: 'رمز التحقق يجب أن يكون نصاً' })
  @Matches(/^\d{6}$/, { message: 'رمز التحقق يجب أن يتكون من 6 أرقام فقط' })
  code!: string;
}
