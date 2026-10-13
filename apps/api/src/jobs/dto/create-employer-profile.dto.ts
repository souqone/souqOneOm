import {
  IsString, IsOptional, MinLength, IsInt, IsPositive, IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateEmployerProfileDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  companySize?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? undefined : value)
  @MinLength(10)
  bio?: string;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  governorateId!: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  wilayaId!: number;

  /** @deprecated Read from user profile phone instead */
  @IsOptional()
  @IsString()
  contactPhone?: string;

  /** @deprecated Managed via whatsappEnabled flag */
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;
}
