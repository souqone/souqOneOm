import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SimilarListingsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'الحد يجب أن يكون رقماً صحيحاً' })
  @Min(1, { message: 'الحد يجب أن يكون 1 على الأقل' })
  @Max(12, { message: 'الحد يجب ألا يزيد عن 12' })
  limit?: number = 8;
}
