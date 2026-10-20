import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class LinkAppleDto {
  @IsString()
  @IsNotEmpty({ message: 'رمز Apple مطلوب' })
  identityToken!: string;

  @IsString()
  @IsNotEmpty({ message: 'رمز التحقق (nonce) مطلوب' })
  @MaxLength(256)
  nonce!: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  reauthGoogleIdToken?: string;
}
