import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'رمز التجديد مطلوب' })
  @IsNotEmpty({ message: 'رمز التجديد لا يمكن أن يكون فارغاً' })
  refreshToken!: string;
}
