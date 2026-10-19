import { IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AppleFullNameDto {
  @IsOptional()
  @IsString({ message: 'الاسم الأول يجب أن يكون نصياً' })
  @MaxLength(100, { message: 'الاسم الأول يجب ألا يتجاوز 100 حرف' })
  givenName?: string;

  @IsOptional()
  @IsString({ message: 'اسم العائلة يجب أن يكون نصياً' })
  @MaxLength(100, { message: 'اسم العائلة يجب ألا يتجاوز 100 حرف' })
  familyName?: string;
}

export class AppleAuthDto {
  @IsString({ message: 'رمز Apple يجب أن يكون نصياً' })
  @IsNotEmpty({ message: 'رمز Apple مطلوب' })
  @MaxLength(4096, { message: 'رمز Apple طويل جداً' })
  identityToken!: string;

  @IsString({ message: 'رمز التحقق (nonce) يجب أن يكون نصياً' })
  @IsNotEmpty({ message: 'رمز التحقق (nonce) مطلوب' })
  @MaxLength(256, { message: 'رمز التحقق (nonce) طويل جداً' })
  nonce!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AppleFullNameDto)
  fullName?: AppleFullNameDto;

  @IsOptional()
  @IsString({ message: 'رمز التفويض يجب أن يكون نصياً' })
  @MaxLength(4096, { message: 'رمز التفويض طويل جداً' })
  authorizationCode?: string;
}
