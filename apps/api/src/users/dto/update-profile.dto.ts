import { IsOptional, IsString, MinLength, MaxLength, Matches, IsInt, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';
import { cleanDisplayName } from '../../auth/auth.validators';

export class UpdateProfileDto {
  @IsOptional()
  @Transform(({ value }) => cleanDisplayName(value))
  @IsString()
  @MinLength(2, { message: 'الاسم المعروض يجب ألا يقل عن حرفين' })
  @MaxLength(50)
  @Matches(/^[^<>]*$/, { message: 'الاسم المعروض لا يجب أن يحتوي على < أو >' })
  displayName?: string;


  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  country?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  governorateId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  wilayaId?: number;

  @IsOptional()
  latitude?: number;

  @IsOptional()
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
