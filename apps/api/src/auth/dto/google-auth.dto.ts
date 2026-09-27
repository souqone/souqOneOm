import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleAuthDto {
  @IsString({ message: 'رمز Google يجب أن يكون نصياً' })
  @IsNotEmpty({ message: 'رمز Google مطلوب' })
  credential!: string;

  @IsOptional()
  @IsString()
  nonce?: string;
}
