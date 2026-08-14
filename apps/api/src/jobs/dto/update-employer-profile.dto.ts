import {
  IsString, IsOptional, MinLength, IsInt, IsPositive,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateEmployerProfileDto {
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

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  governorateId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  wilayaId?: number;
}
