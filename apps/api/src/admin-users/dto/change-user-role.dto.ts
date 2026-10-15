import { IsEnum, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { UserRole } from '@prisma/client';

export class ChangeUserRoleDto {
  @IsEnum(UserRole, { message: 'الدور المحدد غير صالح' })
  role!: UserRole;

  @IsString({ message: 'سبب الإجراء يجب أن يكون نصاً' })
  @MinLength(10, { message: 'سبب الإجراء إلزامي ويجب ألا يقل عن 10 أحرف' })
  @MaxLength(500, { message: 'سبب الإجراء يجب ألا يتجاوز 500 حرف' })
  reason!: string;

  @IsString({ message: 'كلمة مرور الأدمن إلزامية' })
  @IsNotEmpty({ message: 'كلمة مرور الأدمن مطلوبة لتأكيد هذا الإجراء' })
  adminPassword!: string;
}
