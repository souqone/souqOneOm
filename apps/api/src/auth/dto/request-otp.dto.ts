import { IsNotEmpty, IsString } from 'class-validator';

export class RequestOtpDto {
  @IsString({ message: 'رقم الهاتف مطلوب' })
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  phone!: string;
}
