export enum Condition {
  NEW = 'NEW',
  LIKE_NEW = 'LIKE_NEW',
  USED = 'USED',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
}

export enum FuelTypeEnum {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
  HYBRID = 'HYBRID',
  ELECTRIC = 'ELECTRIC',
}

export enum TransmissionEnum {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
}

export enum VehicleType {
  CAR = 'CAR',
  TRUCK = 'TRUCK',
  BUS = 'BUS',
  VAN = 'VAN',
  MOTORCYCLE = 'MOTORCYCLE',
  HEAVY = 'HEAVY',
}

export const OMAN_GOVERNORATES_EN = [
  'Muscat',
  'Dhofar',
  'Musandam',
  'Al Buraimi',
  'Ad Dakhiliyah',
  'North Al Batinah',
  'South Al Batinah',
  'North Ash Sharqiyah',
  'South Ash Sharqiyah',
  'Adh Dhahirah',
  'Al Wusta',
] as const;
