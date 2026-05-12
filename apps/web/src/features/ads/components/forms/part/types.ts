export const PART_CATEGORIES = [
  { value: 'ENGINE',       key: 'partCatEngine' },
  { value: 'BODY',         key: 'partCatBody' },
  { value: 'ELECTRICAL',   key: 'partCatElectrical' },
  { value: 'SUSPENSION',   key: 'partCatSuspension' },
  { value: 'BRAKES',       key: 'partCatBrakes' },
  { value: 'INTERIOR',     key: 'partCatInterior' },
  { value: 'TIRES',        key: 'partCatTires' },
  { value: 'BATTERIES',    key: 'partCatBatteries' },
  { value: 'OILS',         key: 'partCatOils' },
  { value: 'ACCESSORIES',  key: 'partCatAccessories' },
  { value: 'OTHER',        key: 'partCatOther' },
] as const;

export const PART_CONDITIONS = [
  { value: 'NEW',         key: 'partCondNew' },
  { value: 'USED',        key: 'partCondUsed' },
  { value: 'REFURBISHED', key: 'partCondRefurb' },
] as const;

export const CURRENT_YEAR = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i);

export interface PartFormData {
  title: string;
  description: string;
  partCategory: string;
  condition: string;
  partNumber: string;
  compatibleMakes: string[];
  compatibleModels: string[];
  yearFrom: string;
  yearTo: string;
  isOriginal: boolean;
  price: string;
  isPriceNegotiable: boolean;
  currency: string;
  governorate: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string;
  whatsapp: string;
}

export const DEFAULT_PART_FORM: PartFormData = {
  title: '',
  description: '',
  partCategory: '',
  condition: 'USED',
  partNumber: '',
  compatibleMakes: [],
  compatibleModels: [],
  yearFrom: '',
  yearTo: '',
  isOriginal: false,
  price: '',
  isPriceNegotiable: false,
  currency: 'OMR',
  governorate: '',
  city: '',
  latitude: null,
  longitude: null,
  contactPhone: '',
  whatsapp: '',
};
