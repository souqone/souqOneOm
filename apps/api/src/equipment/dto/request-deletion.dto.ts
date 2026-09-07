import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestDeletionDto {
  @IsOptional()
  @IsString({ message: 'سبب الحذف يجب أن يكون نصاً' })
  @MaxLength(500, { message: 'سبب الحذف يجب ألا يتجاوز 500 حرف' })
  reason?: string;
}
