import { IsOptional, IsString, IsEnum, IsIn, IsInt, Min, Max, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { Transmission, ItemCondition, ListingStatus, ListingType } from '@prisma/client';

export class QueryListingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'رقم الصفحة يجب أن يكون رقماً صحيحاً' })
  @Min(1, { message: 'رقم الصفحة يجب أن يكون 1 على الأقل' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'الحد يجب أن يكون رقماً صحيحاً' })
  @Min(1, { message: 'الحد يجب أن يكون 1 على الأقل' })
  @Max(50, { message: 'الحد يجب ألا يزيد عن 50' })
  limit?: number = 20;

  @IsOptional()
  @IsString({ message: 'نص البحث يجب أن يكون نصاً' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'الماركة يجب أن تكون نصاً' })
  make?: string;

  @IsOptional()
  @IsString({ message: 'الموديل يجب أن يكون نصاً' })
  model?: string;

  @IsOptional()
  @IsString({ message: 'الفئة يجب أن تكون نصاً' })
  trim?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'أدنى سنة يجب أن تكون رقماً صحيحاً' })
  yearMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'أقصى سنة يجب أن تكون رقماً صحيحاً' })
  yearMax?: number;

  @IsOptional()
  @Type(() => Number)
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  priceMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'أدنى ممشى يجب أن يكون رقماً صحيحاً' })
  @Min(0, { message: 'أدنى ممشى لا يمكن أن يكون سالباً' })
  mileageMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'أقصى ممشى يجب أن يكون رقماً صحيحاً' })
  @Min(0, { message: 'أقصى ممشى لا يمكن أن يكون سالباً' })
  mileageMax?: number;

  @IsOptional()
  @IsString({ message: 'نوع الوقود يجب أن يكون نصاً' })
  fuelType?: string;

  @IsOptional()
  @IsEnum(Transmission, { message: 'نوع ناقل الحركة غير صالح' })
  transmission?: Transmission;

  @IsOptional()
  @IsEnum(ItemCondition, { message: 'حالة السيارة غير صالحة' })
  condition?: ItemCondition;

  @IsOptional()
  @IsString({ message: 'نوع الهيكل يجب أن يكون نصاً' })
  bodyType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'معرف المحافظة يجب أن يكون رقماً صحيحاً' })
  @IsPositive({ message: 'معرف المحافظة يجب أن يكون رقماً موجباً' })
  governorateId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'معرف الولاية يجب أن يكون رقماً صحيحاً' })
  @IsPositive({ message: 'معرف الولاية يجب أن يكون رقماً موجباً' })
  wilayaId?: number;

  @IsOptional()
  @IsEnum(ListingStatus, { message: 'حالة الإعلان غير صالحة' })
  status?: ListingStatus;

  @IsOptional()
  @IsEnum(ListingType, { message: 'نوع الإعلان غير صالح' })
  listingType?: ListingType;

  @IsOptional()
  @IsIn(['createdAt', 'price', 'year', 'mileage', 'viewCount'], { message: 'حقل الترتيب غير صالح' })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'اتجاه الترتيب يجب أن يكون تصاعدي أو تنازلي' })
  sortOrder?: string = 'desc';

  @IsOptional()
  @IsString({ message: 'معرف البائع يجب أن يكون نصاً' })
  sellerId?: string;
}
