export interface JobFormData {
  jobType: 'HIRING' | 'OFFERING';
  title: string;
  description: string;
  employmentType: string;
  salary: number | '';
  salaryPeriod: string;
  licenseTypes: string[];
  experienceYears: number | '';
  minAge: number | '';
  maxAge: number | '';
  languages: string[];
  nationality: string;
  vehicleTypes: string[];
  hasOwnVehicle: boolean;
  currency: string;
  governorate: string;
  city: string;
  contactPhone: string;
  contactEmail: string;
  whatsapp: string;
}

export const DEFAULT_JOB_FORM: JobFormData = {
  jobType: 'HIRING',
  title: '',
  description: '',
  employmentType: 'FULL_TIME',
  salary: '',
  salaryPeriod: 'MONTHLY',
  licenseTypes: [],
  experienceYears: '',
  minAge: '',
  maxAge: '',
  languages: [],
  nationality: '',
  vehicleTypes: [],
  hasOwnVehicle: false,
  currency: 'OMR',
  governorate: '',
  city: '',
  contactPhone: '',
  contactEmail: '',
  whatsapp: '',
};

export const LICENSE_OPTIONS = [
  { value: 'LIGHT',      key: 'jnLicLight' },
  { value: 'HEAVY',      key: 'jnLicHeavy' },
  { value: 'TRANSPORT',  key: 'jnLicTransport' },
  { value: 'BUS',        key: 'jnLicBus' },
  { value: 'MOTORCYCLE', key: 'jnLicMotorcycle' },
];

export const SALARY_PERIOD_OPTIONS = [
  { value: 'MONTHLY',    key: 'jnPeriodMonthly' },
  { value: 'DAILY',      key: 'jnPeriodDaily' },
  { value: 'YEARLY',     key: 'jnPeriodYearly' },
  { value: 'NEGOTIABLE', key: 'jnPeriodNegotiable' },
];

export const VEHICLE_TYPE_OPTIONS = [
  { value: 'SEDAN',       key: 'jnVtSedan' },
  { value: 'SUV',         key: 'jnVtSUV' },
  { value: 'LIGHT_TRUCK', key: 'jnVtLightTruck' },
  { value: 'HEAVY_TRUCK', key: 'jnVtHeavyTruck' },
  { value: 'BUS',         key: 'jnVtBus' },
  { value: 'LIMO',        key: 'jnVtLimo' },
  { value: 'VAN',         key: 'jnVtVan' },
  { value: 'PICKUP',      key: 'jnVtPickup' },
];

export const LANGUAGE_OPTIONS = [
  { value: 'ARABIC',   key: 'jnLangArabic' },
  { value: 'ENGLISH',  key: 'jnLangEnglish' },
  { value: 'URDU',     key: 'jnLangUrdu' },
  { value: 'HINDI',    key: 'jnLangHindi' },
  { value: 'BENGALI',  key: 'jnLangBengali' },
  { value: 'FILIPINO', key: 'jnLangFilipino' },
];
