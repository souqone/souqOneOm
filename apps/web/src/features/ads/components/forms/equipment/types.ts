export const EQUIP_TYPE_KEYS = [
  { value: 'EXCAVATOR',       labelKey: 'eqExcavator',     icon: 'precision_manufacturing' },
  { value: 'CRANE',           labelKey: 'eqCrane',         icon: 'switch_access_2' },
  { value: 'LOADER',          labelKey: 'eqLoader',        icon: 'front_loader' },
  { value: 'BULLDOZER',       labelKey: 'eqBulldozer',     icon: 'agriculture' },
  { value: 'FORKLIFT',        labelKey: 'eqForklift',      icon: 'forklift' },
  { value: 'CONCRETE_MIXER',  labelKey: 'eqConcreteMixer', icon: 'blender' },
  { value: 'GENERATOR',       labelKey: 'eqGenerator',     icon: 'bolt' },
  { value: 'COMPRESSOR',      labelKey: 'eqCompressor',    icon: 'air' },
  { value: 'SCAFFOLDING',     labelKey: 'eqScaffolding',   icon: 'construction' },
  { value: 'WELDING_MACHINE', labelKey: 'eqWelding',       icon: 'hardware' },
  { value: 'TRUCK',           labelKey: 'eqTruck',         icon: 'local_shipping' },
  { value: 'DUMP_TRUCK',      labelKey: 'eqDumpTruck',     icon: 'local_shipping' },
  { value: 'WATER_TANKER',    labelKey: 'eqWaterTanker',   icon: 'water_drop' },
  { value: 'LIGHT_EQUIPMENT', labelKey: 'eqLightEquip',   icon: 'build' },
  { value: 'OTHER_EQUIPMENT', labelKey: 'eqOther',         icon: 'category' },
] as const;

export const EQUIP_CONDITION_KEYS = [
  { value: 'NEW',      labelKey: 'eqCondNew' },
  { value: 'LIKE_NEW', labelKey: 'eqCondLikeNew' },
  { value: 'GOOD',     labelKey: 'eqCondGood' },
  { value: 'USED',     labelKey: 'eqCondUsed' },
  { value: 'FAIR',     labelKey: 'eqCondFair' },
] as const;

export const EQUIP_FEATURE_LABELS = [
  'GPS', 'مكيف هواء', 'كاميرا', 'مسجل رقمي', 'بلوتوث', 'شاشات',
  'رافعة هيدروليكية', 'بوكسة أوتوماتيك', 'مولّد احتياطي', 'أضواء عمل', 'مرسوم', 'بيانات الساعات',
] as const;

export interface EquipmentFormData {
  listingType: string;
  equipmentType: string;
  title: string;
  description: string;
  make: string;
  model: string;
  year: string;
  condition: string;
  capacity: string;
  power: string;
  weight: string;
  hoursUsed: string;
  features: string[];
  price: string;
  dailyPrice: string;
  weeklyPrice: string;
  monthlyPrice: string;
  isPriceNegotiable: boolean;
  withOperator: boolean;
  deliveryAvailable: boolean;
  minRentalDays: string;
  depositAmount: string;
  insuranceIncluded: boolean;
  availableFrom: string;
  availableTo: string;
  cancellationPolicy: string;
  governorate: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string;
  whatsapp: string;
  kmLimitPerDay: string;
  currency: string;
}

export const DEFAULT_EQUIPMENT_FORM: EquipmentFormData = {
  listingType: '',
  equipmentType: '',
  title: '',
  description: '',
  make: '',
  model: '',
  year: '',
  condition: 'USED',
  capacity: '',
  power: '',
  weight: '',
  hoursUsed: '',
  features: [],
  price: '',
  dailyPrice: '',
  weeklyPrice: '',
  monthlyPrice: '',
  isPriceNegotiable: false,
  withOperator: false,
  deliveryAvailable: false,
  minRentalDays: '',
  depositAmount: '',
  insuranceIncluded: false,
  availableFrom: '',
  availableTo: '',
  cancellationPolicy: '',
  governorate: '',
  city: '',
  latitude: null,
  longitude: null,
  contactPhone: '',
  whatsapp: '',
  kmLimitPerDay: '',
  currency: 'OMR',
};
