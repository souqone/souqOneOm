import {
  IsString, IsOptional, MinLength, IsInt, IsPositive,
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

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;
}
