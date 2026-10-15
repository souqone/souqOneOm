import { IsString, MinLength, MaxLength } from 'class-validator';

export class UnbanUserDto {
  @IsString({ message: 'سبب الإجراء يجب أن يكون نصاً' })
  @MinLength(10, { message: 'سبب الإجراء إلزامي ويجب ألا يقل عن 10 أحرف' })
  @MaxLength(500, { message: 'سبب الإجراء يجب ألا يتجاوز 500 حرف' })
  reason!: string;
}
