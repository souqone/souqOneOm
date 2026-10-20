import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class DeleteAccountDto {
  @IsOptional()
  @IsString({ message: 'كلمة المرور يجب أن تكون نصية' })
  password?: string;

  @IsOptional()
  @IsString({ message: 'رمز Google يجب أن يكون نصياً' })
  googleIdToken?: string;

  @IsOptional()
  @IsString({ message: 'رمز Apple يجب أن يكون نصياً' })
  @MaxLength(4096, { message: 'رمز Apple طويل جداً' })
  appleIdentityToken?: string;

  @IsOptional()
  @IsString({ message: 'رمز التحقق (nonce) يجب أن يكون نصياً' })
  @MaxLength(256, { message: 'رمز التحقق (nonce) طويل جداً' })
  appleNonce?: string;

  @IsOptional()
  @IsString({ message: 'رمز التفويض من Apple يجب أن يكون نصياً' })
  @MaxLength(512, { message: 'رمز التفويض من Apple طويل جداً' })
  appleAuthorizationCode?: string;

  @IsNotEmpty({ message: 'تأكيد الحذف مطلوب' })
  @IsString({ message: 'تأكيد الحذف يجب أن يكون نصياً' })
  @IsIn(['حذف حسابي', 'DELETE'], { message: 'يجب كتابة "حذف حسابي" أو "DELETE" للتأكيد' })
  confirmation!: string;
}
