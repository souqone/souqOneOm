export interface ListingFormData {
  title: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  price: string;
  currency: string;
  mileage: string;
  fuelType: string;
  transmission: string;
  condition: string;
  bodyType: string;
  exteriorColor: string;
  interiorColor: string;
  features: string[];
  engineSize: string;
  horsepower: string;
  doors: string;
  seats: string;
  driveType: string;
  description: string;
  governorate: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  isPriceNegotiable: boolean;
  listingType: 'SALE' | 'RENTAL' | 'WANTED';
  dailyPrice: string;
  monthlyPrice: string;
  withDriver: boolean;
  whatsapp: string;
  contactPhone: string;
}

export const defaultListingData: ListingFormData = {
  title: '',
  make: '',
  model: '',
  trim: '',
  year: new Date().getFullYear(),
  price: '',
  currency: 'OMR',
  mileage: '',
  fuelType: '',
  transmission: '',
  condition: '',
  bodyType: '',
  exteriorColor: '',
  interiorColor: '',
  features: [],
  engineSize: '',
  horsepower: '',
  doors: '',
  seats: '',
  driveType: '',
  description: '',
  governorate: '',
  city: '',
  latitude: null,
  longitude: null,
  isPriceNegotiable: false,
  listingType: 'SALE',
  dailyPrice: '',
  monthlyPrice: '',
  withDriver: false,
  whatsapp: '',
  contactPhone: '',
};

export const CAR_FEATURE_KEYS = [
  'lfFeatureTouchscreen', 'lfFeatureRearCamera', 'lfFeature360Camera', 'lfFeatureParkingSensors',
  'lfFeatureGPS', 'lfFeatureSeatHeaters', 'lfFeatureSeatCooling', 'lfFeatureLeatherSeats',
  'lfFeatureSunroof', 'lfFeatureBluetooth', 'lfFeatureCarPlay', 'lfFeatureAndroidAuto',
  'lfFeatureCruiseControl', 'lfFeatureSmartKey', 'lfFeatureRemoteStart', 'lfFeatureAutoAC',
  'lfFeatureLED', 'lfFeatureAudio', 'lfFeatureRainSensor', 'lfFeatureRemoteOpen',
  'lfFeatureElectricMirrors', 'lfFeatureElectricWindows', 'lfFeatureLaneAssist', 'lfFeatureAutoBrake',
  'lfFeatureWirelessCharger', 'lfFeatureBlindSpot', 'lfFeatureAdaptiveCruise',
] as const;

export type CarFeatureKey = typeof CAR_FEATURE_KEYS[number];

export const fuelOptions = ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC'] as const;
export const transOptions = ['AUTOMATIC', 'MANUAL'] as const;
export const condOptions = ['NEW', 'USED', 'LIKE_NEW'] as const;
