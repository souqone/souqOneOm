import {
  IsString, IsOptional, IsEnum, IsInt, IsBoolean,
  IsNumber, IsArray, Min, Max, MinLength, MaxLength, IsDateString, IsPositive, ValidateIf
} from 'class-validator';

const EQUIPMENT_TYPES = [
  'EXCAVATOR','CRANE','LOADER','BULLDOZER','FORKLIFT','CONCRETE_MIXER',
  'GENERATOR','COMPRESSOR','SCAFFOLDING','WELDING_MACHINE','TRUCK',
  'DUMP_TRUCK','WATER_TANKER','LIGHT_EQUIPMENT','OTHER_EQUIPMENT',
];

export class CreateEquipmentListingDto {
  @IsString() 
  @MinLength(5, { message: 'العنوان يجب أن يكون 5 أحرف على الأقل' })
  @MaxLength(100, { message: 'العنوان يجب ألا يتجاوز 100 حرف' })
  title!: string;

  @IsString() 
  @MinLength(10, { message: 'الوصف يجب أن يكون 10 أحرف على الأقل' })
  @MaxLength(2000, { message: 'الوصف يجب ألا يتجاوز 2000 حرف' })
  description!: string;

  @IsEnum(EQUIPMENT_TYPES, { message: 'نوع المعدة غير صالح' })
  equipmentType!: string;

  @IsEnum(['EQUIPMENT_SALE', 'EQUIPMENT_RENT', 'EQUIPMENT_WANTED'], { message: 'نوع الإعلان غير صالح' })
  listingType!: string;

  @ValidateIf((o: any) => o.listingType !== 'EQUIPMENT_WANTED')
  @IsString() 
  @MinLength(2) 
  @MaxLength(50)
  make?: string;

  @ValidateIf((o: any) => o.listingType !== 'EQUIPMENT_WANTED')
  @IsString() 
  @MinLength(2) 
  @MaxLength(50)
  model?: string;

  @ValidateIf((o: any) => o.listingType !== 'EQUIPMENT_WANTED')
  @IsInt() 
  @Min(1970) 
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @ValidateIf((o: any) => o.listingType !== 'EQUIPMENT_WANTED')
  @IsEnum(['NEW','USED','LIKE_NEW','GOOD','FAIR','POOR'])
  condition?: string;

  @IsOptional() @IsString() @MaxLength(50)
  capacity?: string;

  @IsOptional() @IsString() @MaxLength(50)
  power?: string;

  @IsOptional() @IsString() @MaxLength(50)
  weight?: string;

  @IsOptional() @IsInt() @Min(0)
  hoursUsed?: number;

  @IsOptional() @IsArray() @IsString({ each: true })
  features?: string[];

  // ── سعر البيع ──
  @ValidateIf((o: any) => o.listingType === 'EQUIPMENT_SALE')
  @IsNumber() 
  @Min(1)
  price?: number;

  // ── سعر الإيجار الاسترشادي ──
  @ValidateIf((o: any) => o.listingType === 'EQUIPMENT_RENT')
  @IsOptional()
  @IsNumber() 
  @Min(1)
  dailyPrice?: number;

  @ValidateIf((o: any) => o.listingType === 'EQUIPMENT_RENT')
  @IsOptional()
  @IsNumber() 
  @Min(1)
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
  @ValidateIf((o: any) => o.listingType === 'EQUIPMENT_WANTED')
  @IsOptional()
  @IsNumber() 
  @Min(1)
  budgetMin?: number;

  @ValidateIf((o: any) => o.listingType === 'EQUIPMENT_WANTED')
  @IsNumber() 
  @Min(1)
  budgetMax?: number;

  @IsOptional() @IsString() @MaxLength(50)
  rentalDuration?: string;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  endDate?: string;

  @ValidateIf((o: any) => o.listingType === 'EQUIPMENT_WANTED')
  @IsInt() 
  @Min(1)
  quantity?: number;

  @IsOptional() @IsString()
  siteDetails?: string;

  // ── الموقع ──
  @IsInt()
  @IsPositive()
  governorateId!: number;

  @IsInt()
  @IsPositive()
  wilayaId!: number;

  @IsOptional() @IsNumber()
  latitude?: number;

  @IsOptional() @IsNumber()
  longitude?: number;

  @IsOptional() @IsString()
  contactPhone?: string;

  @IsOptional() @IsString()
  whatsapp?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];
}
