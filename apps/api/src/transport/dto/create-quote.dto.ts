import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteDto {
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  estimatedHours?: number;

  @IsOptional()
  @IsString()
  message?: string;
}
