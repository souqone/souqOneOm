import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeleteAccountDto {
  @IsOptional()
  @IsString({ message: 'كلمة المرور يجب أن تكون نصية' })
  password?: string;

  @IsOptional()
  @IsString({ message: 'رمز Google يجب أن يكون نصياً' })
  googleIdToken?: string;

  @IsNotEmpty({ message: 'تأكيد الحذف مطلوب' })
  @IsString({ message: 'تأكيد الحذف يجب أن يكون نصياً' })
  @IsIn(['حذف حسابي', 'DELETE'], { message: 'يجب كتابة "حذف حسابي" أو "DELETE" للتأكيد' })
  confirmation!: string;
}
