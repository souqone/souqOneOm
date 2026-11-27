import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const GET_MESSAGES_ALLOWED_QUERY_KEYS = ['page', 'limit', 'before'] as const;

export class GetMessagesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 30;

  @IsOptional()
  @IsString({ message: 'معرف الرسالة المرجعية غير صالح' })
  @IsNotEmpty({ message: 'معرف الرسالة المرجعية غير صالح' })
  @MaxLength(64, { message: 'معرف الرسالة المرجعية طويل جداً' })
  before?: string;
}
