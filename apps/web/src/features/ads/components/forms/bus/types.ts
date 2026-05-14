export const BUS_LISTING_TYPE_KEYS = [
  { value: 'BUS_SALE',              labelKey: 'busTypeSale',         icon: 'sell',          descKey: 'busTypeSaleDesc' },
  { value: 'BUS_SALE_WITH_CONTRACT', labelKey: 'busTypeSaleContract', icon: 'assignment',    descKey: 'busTypeSaleContractDesc' },
  { value: 'BUS_RENT',              labelKey: 'busTypeRent',         icon: 'car_rental',    descKey: 'busTypeRentDesc' },
  { value: 'BUS_CONTRACT',          labelKey: 'busTypeContract',     icon: 'request_quote', descKey: 'busTypeContractDesc' },
] as const;

export const BUS_TYPE_KEYS = [
  { value: 'MINI_BUS',   labelKey: 'busSizeMini',    descKey: 'busSizeMiniDesc' },
  { value: 'MEDIUM_BUS', labelKey: 'busSizeMedium',  descKey: 'busSizeMediumDesc' },
  { value: 'LARGE_BUS',  labelKey: 'busSizeLarge',   descKey: 'busSizeLargeDesc' },
  { value: 'COASTER',    labelKey: 'busSizeCoaster',  descKey: 'busSizeCoasterDesc' },
  { value: 'SCHOOL_BUS', labelKey: 'busSizeSchool',  descKey: 'busSizeSchoolDesc' },
] as const;

export const CONTRACT_TYPE_KEYS = [
  { value: 'SCHOOL',          labelKey: 'busContractSchool' },
  { value: 'COMPANY',         labelKey: 'busContractCompany' },
  { value: 'GOVERNMENT',      labelKey: 'busContractGov' },
  { value: 'TOURISM',         labelKey: 'busContractTourism' },
  { value: 'OTHER_CONTRACT',  labelKey: 'busContractOther' },
] as const;

export const FUEL_TYPE_KEYS = [
  { value: 'DIESEL',   labelKey: 'busFuelDiesel' },
  { value: 'PETROL',   labelKey: 'busFuelPetrol' },
  { value: 'HYBRID',   labelKey: 'busFuelHybrid' },
  { value: 'ELECTRIC', labelKey: 'busFuelElectric' },
] as const;

export const CONDITION_KEYS = [
  { value: 'NEW',      labelKey: 'busCondNew' },
  { value: 'LIKE_NEW', labelKey: 'busCondLikeNew' },
  { value: 'USED',     labelKey: 'busCondUsed' },
  { value: 'GOOD',     labelKey: 'busCondGood' },
  { value: 'FAIR',     labelKey: 'busCondFair' },
] as const;

export const BUS_FEATURE_KEYS = [
  'busFeatAC', 'busFeatWifi', 'busFeatScreens', 'busFeatUSB', 'busFeatLeather', 'busFeatSeatbelt',
  'busFeatCamera', 'busFeatGPS', 'busFeatLuggage', 'busFeatHydraulic', 'busFeatFridge', 'busFeatMic',
] as const;

export interface BusFormData {
  busListingType: string;
  busType: string;
  title: string;
  description: string;
  make: string;
  model: string;
  manufacturerId?: string;
  modelId?: string;
  year: string;
  capacity: string;
  mileage: string;
  fuelType: string;
  transmission: string;
  condition: string;
  features: string[];
  plateNumber: string;
  price: string;
  isPriceNegotiable: boolean;
  contractType: string;
  contractClient: string;
  contractMonthly: string;
  contractDuration: string;
  contractExpiry: string;
  dailyPrice: string;
  monthlyPrice: string;
  minRentalDays: string;
  withDriver: boolean;
  deliveryAvailable: boolean;
  depositAmount: string;
  insuranceIncluded: boolean;
  availableFrom: string;
  availableTo: string;
  cancellationPolicy: string;
  requestPassengers: string;
  requestRoute: string;
  requestSchedule: string;
  governorate: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string;
  whatsapp: string;
}

export const DEFAULT_BUS_FORM: BusFormData = {
  busListingType: '',
  busType: '',
  title: '',
  description: '',
  make: '',
  model: '',
  manufacturerId: undefined,
  modelId: undefined,
  year: '',
  capacity: '',
  mileage: '',
  fuelType: '',
  transmission: '',
  condition: 'USED',
  features: [],
  plateNumber: '',
  price: '',
  isPriceNegotiable: false,
  contractType: '',
  contractClient: '',
  contractMonthly: '',
  contractDuration: '',
  contractExpiry: '',
  dailyPrice: '',
  monthlyPrice: '',
  minRentalDays: '',
  withDriver: false,
  deliveryAvailable: false,
  depositAmount: '',
  insuranceIncluded: false,
  availableFrom: '',
  availableTo: '',
  cancellationPolicy: '',
  requestPassengers: '',
  requestRoute: '',
  requestSchedule: '',
  governorate: '',
  city: '',
  latitude: null,
  longitude: null,
  contactPhone: '',
  whatsapp: '',
};
