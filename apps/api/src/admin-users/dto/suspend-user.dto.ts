import { IsOptional, IsString, MinLength, MaxLength, IsDateString } from 'class-validator';

export class SuspendUserDto {
  @IsString({ message: 'سبب الإجراء يجب أن يكون نصاً' })
  @MinLength(10, { message: 'سبب الإجراء إلزامي ويجب ألا يقل عن 10 أحرف' })
  @MaxLength(500, { message: 'سبب الإجراء يجب ألا يتجاوز 500 حرف' })
  reason!: string;

  @IsOptional()
  @IsDateString({}, { message: 'تاريخ انتهاء الإيقاف يجب أن يكون بصيغة ISO صالحة' })
  until?: string;
}
