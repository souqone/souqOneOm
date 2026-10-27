import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceDto } from './create-service.dto';
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  /** Optimistic-concurrency token: the `version` the client last read. Mismatch -> 409. Optional for backward compatibility with existing mobile clients. */
  @IsOptional()
  @IsInt({ message: 'رقم النسخة يجب أن يكون رقماً صحيحاً' })
  @Min(1)
  @Type(() => Number)
  version?: number;
}
