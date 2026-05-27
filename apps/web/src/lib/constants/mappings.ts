// ─── Translator type ───
type T = (key: string) => string;

// ─── Fuel ───
export function fuelLabels(t: T): Record<string, string> {
  return { PETROL: t('fuelPetrol'), DIESEL: t('fuelDiesel'), HYBRID: t('fuelHybrid'), ELECTRIC: t('fuelElectric') };
}
export function fuelOptions(t: T) { return Object.entries(fuelLabels(t)).map(([value, label]) => ({ value, label })); }

// ─── Transmission ───
export function transmissionLabels(t: T): Record<string, string> {
  return { AUTOMATIC: t('transmissionAutomatic'), MANUAL: t('transmissionManual') };
}
export function transmissionOptions(t: T) { return Object.entries(transmissionLabels(t)).map(([value, label]) => ({ value, label })); }

// ─── Condition ───
export function conditionLabels(t: T): Record<string, string> {
  return { NEW: t('conditionNew'), USED: t('conditionUsed'), LIKE_NEW: t('conditionLikeNew'), GOOD: t('conditionGood'), FAIR: t('conditionFair'), POOR: t('conditionPoor') };
}
export function conditionOptions(t: T) { return Object.entries(conditionLabels(t)).map(([value, label]) => ({ value, label })); }

// ─── Unified Badge System ───
// All overlay badges use solid colors for readability on any image background.
// Base size: text-[10px] font-black px-2 py-0.5

const CONDITION_BADGE_CLS: Record<string, string> = {
  NEW:      'bg-emerald-600 text-white text-[10px] font-black',
  LIKE_NEW: 'bg-teal-600 text-white text-[10px] font-black',
  USED:     'bg-slate-500 text-white text-[10px] font-black',
  GOOD:     'bg-sky-600 text-white text-[10px] font-black',
  FAIR:     'bg-amber-500 text-white text-[10px] font-black',
  POOR:     'bg-rose-600 text-white text-[10px] font-black',
};

export function conditionBadge(t: T): Record<string, { label: string; cls: string }> {
  return {
    NEW:      { label: t('conditionNew'),    cls: CONDITION_BADGE_CLS.NEW },
    LIKE_NEW: { label: t('conditionLikeNew'), cls: CONDITION_BADGE_CLS.LIKE_NEW },
    USED:     { label: t('conditionUsed'),   cls: CONDITION_BADGE_CLS.USED },
    GOOD:     { label: t('conditionGood'),   cls: CONDITION_BADGE_CLS.GOOD },
    FAIR:     { label: t('conditionFair'),   cls: CONDITION_BADGE_CLS.FAIR },
    POOR:     { label: t('conditionPoor'),   cls: CONDITION_BADGE_CLS.POOR },
  };
}

const PART_CONDITION_BADGE_CLS: Record<string, string> = {
  NEW:         'bg-emerald-600 text-white',
  USED:        'bg-slate-500 text-white',
  REFURBISHED: 'bg-sky-600 text-white',
};

export function partConditionBadge(t: T): Record<string, { label: string; cls: string }> {
  return {
    NEW:         { label: t('conditionNew'),         cls: PART_CONDITION_BADGE_CLS.NEW },
    USED:        { label: t('conditionUsed'),        cls: PART_CONDITION_BADGE_CLS.USED },
    REFURBISHED: { label: t('conditionRefurbished'), cls: PART_CONDITION_BADGE_CLS.REFURBISHED },
  };
}

// Solid badge colors per entity category
export const BADGE_COLORS = {
  rental:    'bg-emerald-600 text-white',
  wanted:    'bg-orange-500 text-white',
  service:   'bg-violet-600 text-white',
  schedule:  'bg-slate-500 text-white',
  original:  'bg-primary text-on-primary',
  mobile:    'bg-emerald-600 text-white',
} as const;

// ─── Listing Type ───
export function listingTypeLabels(t: T): Record<string, string> {
  return { SALE: t('typeSale'), RENTAL: t('typeRental'), WANTED: t('typeWanted') };
}

// Light pill colors for feature tags in card body
export const PILL_COLORS = {
  green:   'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  primary: 'bg-primary/10 text-primary',
  info:    'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  neutral: 'bg-surface-container-low text-on-surface-variant',
} as const;

// ─── Drive Type ───
export function driveLabels(t: T): Record<string, string> {
  return { FWD: t('driveFWD'), RWD: t('driveRWD'), AWD: t('driveAWD'), '4WD': t('drive4WD') };
}

// ─── Exterior Colors ───
const EXTERIOR_COLOR_DATA: { key: string; hex: string }[] = [
  { key: 'white', hex: '#FFFFFF' },
  { key: 'pearlWhite', hex: '#F5F5F0' },
  { key: 'silver', hex: '#C0C0C0' },
  { key: 'gray', hex: '#808080' },
  { key: 'darkGray', hex: '#505050' },
  { key: 'mineralGray', hex: '#6B6B6B' },
  { key: 'black', hex: '#1A1A1A' },
  { key: 'obsidianBlack', hex: '#0B0B0B' },
  { key: 'red', hex: '#CC0000' },
  { key: 'carmineRed', hex: '#960018' },
  { key: 'burgundy', hex: '#722F37' },
  { key: 'blue', hex: '#1E3A8A' },
  { key: 'lightBlue', hex: '#60A5FA' },
  { key: 'navy', hex: '#1B1F3B' },
  { key: 'green', hex: '#166534' },
  { key: 'britishGreen', hex: '#1B4D3E' },
  { key: 'oliveGreen', hex: '#556B2F' },
  { key: 'beige', hex: '#D4C5A9' },
  { key: 'gold', hex: '#C9A84C' },
  { key: 'bronze', hex: '#8C6E46' },
  { key: 'brown', hex: '#6B3A2A' },
  { key: 'orange', hex: '#EA580C' },
  { key: 'yellow', hex: '#EAB308' },
  { key: 'purple', hex: '#7C3AED' },
];

export function exteriorColors(t: T): { value: string; label: string; hex: string }[] {
  return EXTERIOR_COLOR_DATA.map(c => ({ value: c.key, label: t(c.key), hex: c.hex }));
}

// ─── Interior Colors ───
const INTERIOR_COLOR_DATA: { key: string; hex: string }[] = [
  { key: 'blackLeather', hex: '#1A1A1A' },
  { key: 'beigeLeather', hex: '#D4C5A9' },
  { key: 'brownLeather', hex: '#6B3A2A' },
  { key: 'whiteLeather', hex: '#F5F5F0' },
  { key: 'redLeather', hex: '#CC0000' },
  { key: 'cognacLeather', hex: '#9A4E28' },
  { key: 'napaBlackLeather', hex: '#0B0B0B' },
  { key: 'grayLeather', hex: '#808080' },
  { key: 'blackFabric', hex: '#2A2A2A' },
  { key: 'grayFabric', hex: '#909090' },
  { key: 'beigeFabric', hex: '#C8B896' },
];

export function interiorColors(t: T): { value: string; label: string; hex: string }[] {
  return INTERIOR_COLOR_DATA.map(c => ({ value: c.key, label: t(c.key), hex: c.hex }));
}

// ─── Body Type ───
export const BODY_OPTIONS = ['SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'TRUCK', 'VAN', 'CONVERTIBLE', 'WAGON'] as const;

// ─── Drive Options ───
export const DRIVE_OPTIONS = ['FWD', 'RWD', 'AWD', '4WD'] as const;

// ─── Sort ───
export function sortOptions(t: T) {
  return [
    { value: 'createdAt_desc', label: t('sortNewest') },
    { value: 'createdAt_asc', label: t('sortOldest') },
    { value: 'price_asc', label: t('sortPriceLow') },
    { value: 'price_desc', label: t('sortPriceHigh') },
    { value: 'year_desc', label: t('sortYearNew') },
  ];
}
