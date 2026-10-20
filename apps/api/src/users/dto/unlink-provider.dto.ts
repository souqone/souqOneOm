import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UnlinkProviderDto {
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  reauthGoogleIdToken?: string;

  @IsOptional()
  @IsString()
  reauthAppleIdToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  reauthAppleNonce?: string;
}
