import {
  IsString, IsOptional, IsEnum, IsInt, IsBoolean,
  IsNumber, IsArray, Min, Max, MinLength, IsDateString,
} from 'class-validator';

const EQUIPMENT_TYPES = [
  'EXCAVATOR','CRANE','LOADER','BULLDOZER','FORKLIFT','CONCRETE_MIXER',
  'GENERATOR','COMPRESSOR','SCAFFOLDING','WELDING_MACHINE','TRUCK',
  'DUMP_TRUCK','WATER_TANKER','LIGHT_EQUIPMENT','OTHER_EQUIPMENT',
];

export class CreateEquipmentListingDto {
  @IsString() @MinLength(5, { message: 'العنوان يجب أن يكون 5 أحرف على الأقل' })
  title!: string;

  @IsString() @MinLength(10, { message: 'الوصف يجب أن يكون 10 أحرف على الأقل' })
  description!: string;

  @IsEnum(EQUIPMENT_TYPES, { message: 'نوع المعدة غير صالح' })
  equipmentType!: string;

  @IsEnum(['EQUIPMENT_SALE', 'EQUIPMENT_RENT', 'EQUIPMENT_WANTED'], { message: 'نوع الإعلان غير صالح' })
  listingType!: string;

  @IsOptional() @IsString()
  make?: string;

  @IsOptional() @IsString()
  model?: string;

  @IsOptional() @IsInt() @Min(1950) @Max(2030)
  year?: number;

  @IsOptional() @IsEnum(['NEW','USED','LIKE_NEW','GOOD','FAIR','POOR'])
  condition?: string;

  @IsOptional() @IsString()
  capacity?: string;

  @IsOptional() @IsString()
  power?: string;

  @IsOptional() @IsString()
  weight?: string;

  @IsOptional() @IsInt() @Min(0)
  hoursUsed?: number;

  @IsOptional() @IsArray() @IsString({ each: true })
  features?: string[];

  // ── سعر البيع ──
  @IsOptional() @IsNumber() @Min(0)
  price?: number;

  // ── سعر الإيجار الاسترشادي ──
  @IsOptional() @IsNumber() @Min(0)
  dailyPrice?: number;

  @IsOptional() @IsNumber() @Min(0)
  monthlyPrice?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsBoolean()
  isPriceNegotiable?: boolean;

  @IsOptional() @IsBoolean()
  withOperator?: boolean;

  @IsOptional() @IsBoolean()
  deliveryAvailable?: boolean;

  // ── حقول EQUIPMENT_WANTED ──
  @IsOptional() @IsNumber() @Min(0)
  budgetMin?: number;

  @IsOptional() @IsNumber() @Min(0)
  budgetMax?: number;

  @IsOptional() @IsString()
  rentalDuration?: string;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  endDate?: string;

  @IsOptional() @IsInt() @Min(1)
  quantity?: number;

  @IsOptional() @IsString()
  siteDetails?: string;

  // ── الموقع ──
  @IsOptional() @IsString()
  governorate?: string;

  @IsOptional() @IsString()
  city?: string;

  @IsOptional() @IsNumber()
  latitude?: number;

  @IsOptional() @IsNumber()
  longitude?: number;

  @IsOptional() @IsString()
  contactPhone?: string;

  @IsOptional() @IsString()
  whatsapp?: string;
}
