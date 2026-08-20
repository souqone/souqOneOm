import {
  IsString, IsOptional, IsEnum, IsInt, IsBoolean,
  IsNumber, IsArray, Min, Max, MinLength, MaxLength, IsDateString, IsPositive
} from 'class-validator';

const EQUIPMENT_TYPES = [
  'EXCAVATOR','CRANE','LOADER','BULLDOZER','FORKLIFT','CONCRETE_MIXER',
  'GENERATOR','COMPRESSOR','SCAFFOLDING','WELDING_MACHINE','TRUCK',
  'DUMP_TRUCK','WATER_TANKER','LIGHT_EQUIPMENT','OTHER_EQUIPMENT',
];

export class UpdateEquipmentListingDto {
  @IsOptional() 
  @IsString() 
  @MinLength(5)
  @MaxLength(100)
  title?: string;

  @IsOptional() 
  @IsString() 
  @MinLength(10)
  @MaxLength(2000)
  description?: string;

  @IsOptional() 
  @IsEnum(EQUIPMENT_TYPES, { message: 'نوع المعدة غير صالح' })
  equipmentType?: string;

  @IsOptional() 
  @IsEnum(['EQUIPMENT_SALE', 'EQUIPMENT_RENT', 'EQUIPMENT_WANTED'])
  listingType?: string;

  @IsOptional()
  @IsString() 
  @MinLength(2) 
  @MaxLength(50)
  make?: string;

  @IsOptional()
  @IsString() 
  @MinLength(2) 
  @MaxLength(50)
  model?: string;

  @IsOptional()
  @IsInt() 
  @Min(1970) 
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @IsOptional()
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

  @IsOptional()
  @IsNumber() 
  @Min(1)
  price?: number;

  @IsOptional()
  @IsNumber() 
  @Min(1)
  dailyPrice?: number;

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
  @IsOptional()
  @IsNumber() 
  @Min(1)
  budgetMin?: number;

  @IsOptional()
  @IsNumber() 
  @Min(1)
  budgetMax?: number;

  @IsOptional() @IsString() @MaxLength(50)
  rentalDuration?: string;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt() 
  @Min(1)
  quantity?: number;

  @IsOptional() @IsString()
  siteDetails?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  governorateId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  wilayaId?: number;

  @IsOptional() @IsNumber()
  latitude?: number;

  @IsOptional() @IsNumber()
  longitude?: number;

  @IsOptional() @IsString()
  contactPhone?: string;

  @IsOptional() @IsString()
  whatsapp?: string;
}
