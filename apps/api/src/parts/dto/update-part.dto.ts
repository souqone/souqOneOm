import { PartialType } from '@nestjs/mapped-types';
import { CreatePartDto } from './create-part.dto';
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePartDto extends PartialType(CreatePartDto) {
  /** Optimistic-concurrency token: the `version` the client last read. Mismatch -> 409. Optional for backward compatibility with existing mobile clients. */
  @IsOptional()
  @IsInt({ message: 'رقم النسخة يجب أن يكون رقماً صحيحاً' })
  @Min(1)
  @Type(() => Number)
  version?: number;
}
