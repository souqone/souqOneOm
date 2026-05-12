export const SERVICE_TYPES = [
  { value: 'MAINTENANCE',         label: 'صيانة',          icon: 'build' },
  { value: 'CLEANING',            label: 'غسيل وتنظيف',   icon: 'local_car_wash' },
  { value: 'INSPECTION',          label: 'فحص',            icon: 'search' },
  { value: 'BODYWORK',            label: 'بناء وتوبير',    icon: 'car_repair' },
  { value: 'TOWING',              label: 'سحب وإنقاذ',     icon: 'rv_hookup' },
  { value: 'MODIFICATION',        label: 'تعديلات',        icon: 'tune' },
  { value: 'KEYS_LOCKS',          label: 'مفاتيح وأقفال', icon: 'key' },
  { value: 'ACCESSORIES_INSTALL', label: 'تركيب إكسسوار', icon: 'settings_input_component' },
  { value: 'OTHER_SERVICE',       label: 'أخرى',           icon: 'more_horiz' },
];

export const PROVIDER_TYPES = [
  { value: 'WORKSHOP', label: 'ورشة',   icon: 'garage',         desc: 'موقع ثابت' },
  { value: 'MOBILE',   label: 'متنقل',  icon: 'local_shipping', desc: 'يأتي إليك' },
  { value: 'BOTH',     label: 'كلاهما', icon: 'sync_alt',       desc: 'ورشة ومتنقل' },
];

export const WEEKDAYS = [
  { value: 'SAT', label: 'السبت' },
  { value: 'SUN', label: 'الأحد' },
  { value: 'MON', label: 'الاثنين' },
  { value: 'TUE', label: 'الثلاثاء' },
  { value: 'WED', label: 'الأربعاء' },
  { value: 'THU', label: 'الخميس' },
  { value: 'FRI', label: 'الجمعة' },
];

export const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12;
  const ampm = i < 12 ? 'ص' : 'م';
  const padded = String(i).padStart(2, '0') + ':00';
  return { value: padded, label: `${h}:00 ${ampm}` };
});

export interface ServiceFormData {
  title: string;
  description: string;
  serviceType: string;
  providerType: string;
  providerName: string;
  specializations: string[];
  priceFrom: number | '';
  priceTo: number | '';
  isHomeService: boolean;
  currency: string;
  workingHoursOpen: string;
  workingHoursClose: string;
  workingDays: string[];
  governorate: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string;
  whatsapp: string;
  website: string;
}

export const DEFAULT_SERVICE_FORM: ServiceFormData = {
  title: '',
  description: '',
  serviceType: '',
  providerType: 'WORKSHOP',
  providerName: '',
  specializations: [],
  priceFrom: '',
  priceTo: '',
  isHomeService: false,
  currency: 'OMR',
  workingHoursOpen: '08:00',
  workingHoursClose: '20:00',
  workingDays: ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU'],
  governorate: '',
  city: '',
  address: '',
  latitude: null,
  longitude: null,
  contactPhone: '',
  whatsapp: '',
  website: '',
};
