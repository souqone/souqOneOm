import { IsString, IsInt, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, Min, Max, MaxLength, IsPositive, ArrayMaxSize, IsNotEmpty, IsLatitude, IsLongitude } from 'class-validator';
import { FuelType, Transmission, ItemCondition, ListingType } from '@prisma/client';

export class CreateListingDto {
  @IsString({ message: 'العنوان يجب أن يكون نصاً' })
  @MaxLength(200, { message: 'العنوان يجب ألا يتجاوز 200 حرف' })
  title!: string;

  @IsString({ message: 'الوصف يجب أن يكون نصاً' })
  description!: string;

  @IsInt({ message: 'سنة الصنع يجب أن تكون رقماً صحيحاً' })
  @Min(1900, { message: 'سنة الصنع يجب أن تكون 1900 أو أحدث' })
  @Max(2030, { message: 'سنة الصنع يجب ألا تتجاوز 2030' })
  year!: number;

  @IsNumber({}, { message: 'السعر يجب أن يكون رقماً' })
  @Min(0, { message: 'السعر لا يمكن أن يكون سالباً' })
  price!: number;

  @IsOptional()
  @IsInt({ message: 'الممشى يجب أن يكون رقماً صحيحاً' })
  @Min(0, { message: 'الممشى لا يمكن أن يكون سالباً' })
  mileage?: number;

  @IsOptional()
  @IsEnum(FuelType, { message: 'نوع الوقود غير صالح' })
  fuelType?: FuelType;

  @IsOptional()
  @IsEnum(Transmission, { message: 'نوع ناقل الحركة غير صالح' })
  transmission?: Transmission;

  @IsOptional()
  @IsString({ message: 'نوع الهيكل يجب أن يكون نصاً' })
  bodyType?: string;

  @IsOptional()
  @IsString({ message: 'اللون الخارجي يجب أن يكون نصاً' })
  exteriorColor?: string;

  @IsOptional()
  @IsString({ message: 'اللون الداخلي يجب أن يكون نصاً' })
  interior?: string;

  @IsOptional()
  @IsString({ message: 'سعة المحرك يجب أن تكون نصاً' })
  engineSize?: string;

  @IsOptional()
  @IsInt({ message: 'القوة الحصانية يجب أن تكون رقماً صحيحاً' })
  horsepower?: number;

  @IsOptional()
  @IsInt({ message: 'عدد الأبواب يجب أن يكون رقماً صحيحاً' })
  doors?: number;

  @IsOptional()
  @IsInt({ message: 'عدد المقاعد يجب أن يكون رقماً صحيحاً' })
  seats?: number;

  @IsOptional()
  @IsString({ message: 'نظام الدفع يجب أن يكون نصاً' })
  driveType?: string;

  @IsOptional()
  @IsArray({ message: 'المميزات يجب أن تكون قائمة' })
  @IsString({ each: true, message: 'كل ميزة يجب أن تكون نصاً' })
  features?: string[];

  @IsOptional()
  @IsString({ message: 'العملة يجب أن تكون نصاً' })
  currency?: string;

  @IsOptional()
  @IsBoolean({ message: 'قابلية التفاوض يجب أن تكون قيمة منطقية' })
  isPriceNegotiable?: boolean;

  @IsOptional()
  @IsEnum(ItemCondition, { message: 'حالة السيارة غير صالحة' })
  condition?: ItemCondition;

  @IsOptional()
  @IsEnum(ListingType, { message: 'نوع الإعلان غير صالح' })
  listingType?: ListingType;

  // سعر الإيجار الاسترشادي
  @IsOptional()
  @IsNumber({}, { message: 'سعر الإيجار اليومي يجب أن يكون رقماً' })
  @Min(0, { message: 'سعر الإيجار اليومي لا يمكن أن يكون سالباً' })
  dailyPrice?: number;

  @IsOptional()
  @IsNumber({}, { message: 'سعر الإيجار الشهري يجب أن يكون رقماً' })
  @Min(0, { message: 'سعر الإيجار الشهري لا يمكن أن يكون سالباً' })
  monthlyPrice?: number;

  @IsOptional()
  @IsBoolean({ message: 'خيار السائق يجب أن يكون قيمة منطقية' })
  withDriver?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'مبلغ التأمين يجب أن يكون رقماً' })
  @Min(0, { message: 'مبلغ التأمين لا يمكن أن يكون سالباً' })
  depositAmount?: number;

  @IsOptional()
  @IsInt({ message: 'أدنى مدة للإيجار يجب أن تكون رقماً صحيحاً' })
  @Min(1, { message: 'أدنى مدة للإيجار يجب أن تكون يوماً واحداً على الأقل' })
  minRentalDays?: number;

  @IsOptional()
  @IsInt({ message: 'حد الكيلومترات اليومي يجب أن يكون رقماً صحيحاً' })
  @Min(0, { message: 'حد الكيلومترات اليومي لا يمكن أن يكون سالباً' })
  kmLimitPerDay?: number;

  @IsOptional()
  @IsString({ message: 'سياسة الإلغاء يجب أن تكون نصاً' })
  cancellationPolicy?: string;

  @IsOptional()
  @IsBoolean({ message: 'خيار التوصيل يجب أن يكون قيمة منطقية' })
  deliveryAvailable?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'خيار التأمين يجب أن يكون قيمة منطقية' })
  insuranceIncluded?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'تفعيل الواتساب يجب أن يكون قيمة منطقية' })
  whatsappEnabled?: boolean;

  @IsInt({ message: 'معرف المحافظة يجب أن يكون رقماً صحيحاً' })
  @IsPositive({ message: 'معرف المحافظة يجب أن يكون رقماً موجباً' })
  governorateId!: number;

  @IsInt({ message: 'معرف الولاية يجب أن يكون رقماً صحيحاً' })
  @IsPositive({ message: 'معرف الولاية يجب أن يكون رقماً موجباً' })
  wilayaId!: number;

  @IsOptional()
  @IsLatitude({ message: 'خط العرض غير صالح' })
  latitude?: number;

  @IsOptional()
  @IsLongitude({ message: 'خط الطول غير صالح' })
  longitude?: number;

  @IsString({ message: 'معرف الماركة يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'معرف الماركة مطلوب' })
  brandId!: string;

  @IsString({ message: 'معرف الموديل يجب أن يكون نصاً' })
  @IsNotEmpty({ message: 'معرف الموديل مطلوب' })
  carModelId!: string;

  @IsOptional()
  @IsString({ message: 'معرف الفئة يجب أن يكون نصاً' })
  carTrimId?: string;

  @IsOptional()
  @IsArray({ message: 'الصور يجب أن تكون قائمة' })
  @IsString({ each: true, message: 'رابط الصورة يجب أن يكون نصاً' })
  @ArrayMaxSize(20, { message: 'لا يمكن تجاوز 20 صورة' })
  images?: string[];
}
