export const OPERATOR_TYPES = [
  { value: 'CRANE_OPERATOR',     label: 'مشغّل رافعة',       icon: 'precision_manufacturing' },
  { value: 'EXCAVATOR_OPERATOR', label: 'مشغّل حفار',        icon: 'construction' },
  { value: 'FORKLIFT_OPERATOR',  label: 'مشغّل رافعة شوكية', icon: 'forklift' },
  { value: 'TRUCK_DRIVER',       label: 'سائق شاحنة',        icon: 'local_shipping' },
  { value: 'BULLDOZER_OPERATOR', label: 'مشغّل بلدوزر',      icon: 'agriculture' },
  { value: 'HEAVY_EQUIPMENT',    label: 'معدات ثقيلة عامة',  icon: 'engineering' },
  { value: 'OTHER_OPERATOR',     label: 'أخرى',              icon: 'more_horiz' },
];

export const EQUIPMENT_TYPE_OPTIONS = [
  { value: 'CRANE',           label: 'رافعة' },
  { value: 'EXCAVATOR',       label: 'حفار' },
  { value: 'LOADER',          label: 'لودر' },
  { value: 'BULLDOZER',       label: 'بلدوزر' },
  { value: 'FORKLIFT',        label: 'رافعة شوكية' },
  { value: 'CONCRETE_MIXER',  label: 'خلاط خرسانة' },
  { value: 'GENERATOR',       label: 'مولّد كهربائي' },
  { value: 'COMPRESSOR',      label: 'ضاغط هواء' },
  { value: 'TRUCK',           label: 'شاحنة' },
  { value: 'DUMP_TRUCK',      label: 'شاحنة قلاّبة' },
  { value: 'WATER_TANKER',    label: 'صهريج ماء' },
  { value: 'LIGHT_EQUIPMENT', label: 'معدات خفيفة' },
  { value: 'OTHER_EQUIPMENT', label: 'أخرى' },
];

export interface OperatorFormData {
  operatorType: string;
  title: string;
  description: string;
  specializations: string[];
  experienceYears: number | '';
  equipmentTypes: string[];
  certifications: string[];
  dailyRate: number | '';
  hourlyRate: number | '';
  isPriceNegotiable: boolean;
  currency: string;
  governorate: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string;
  whatsapp: string;
}

export const DEFAULT_OPERATOR_FORM: OperatorFormData = {
  operatorType: '',
  title: '',
  description: '',
  specializations: [],
  experienceYears: '',
  equipmentTypes: [],
  certifications: [],
  dailyRate: '',
  hourlyRate: '',
  isPriceNegotiable: false,
  currency: 'OMR',
  governorate: '',
  city: '',
  latitude: null,
  longitude: null,
  contactPhone: '',
  whatsapp: '',
};
