import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class LinkGoogleDto {
  @IsString()
  @IsNotEmpty({ message: 'رمز Google مطلوب' })
  credential!: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  nonce?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  reauthAppleIdToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  reauthAppleNonce?: string;
}
