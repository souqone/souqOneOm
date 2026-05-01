// ─── Oman Location System ───
// Oman → Governorates → Cities

export interface LocationOption {
  value: string;
  label: string;
}

interface CityMap {
  [governorateCode: string]: LocationOption[];
}

interface GovernorateMap {
  [countryCode: string]: LocationOption[];
}

interface CityDataMap {
  [countryCode: string]: CityMap;
}

// ─── Countries ───
export const countries: LocationOption[] = [
  { value: 'OM', label: 'عُمان' },
];

// ─── Governorates per Country ───
const governorates: GovernorateMap = {
  // ══════════════ عُمان ══════════════
  OM: [
    { value: 'OM_MUS', label: 'مسقط' },
    { value: 'OM_DHO', label: 'ظفار' },
    { value: 'OM_DAK', label: 'الداخلية' },
    { value: 'OM_BAN', label: 'شمال الباطنة' },
    { value: 'OM_BAS', label: 'جنوب الباطنة' },
    { value: 'OM_SHN', label: 'شمال الشرقية' },
    { value: 'OM_SHS', label: 'جنوب الشرقية' },
    { value: 'OM_DHA', label: 'الظاهرة' },
    { value: 'OM_BUR', label: 'البريمي' },
    { value: 'OM_MSN', label: 'مسندم' },
    { value: 'OM_WUS', label: 'الوسطى' },
  ],

};

// ─── Cities per Governorate ───
const cities: CityDataMap = {
  // ══════════════ عُمان — المدن ══════════════
  OM: {
    OM_MUS: [
      { value: 'السيب', label: 'السيب' },
      { value: 'بوشر', label: 'بوشر' },
      { value: 'مطرح', label: 'مطرح' },
      { value: 'العامرات', label: 'العامرات' },
      { value: 'قريات', label: 'قريات' },
      { value: 'مسقط', label: 'مسقط' },
    ],
    OM_DHO: [
      { value: 'صلالة', label: 'صلالة' },
      { value: 'طاقة', label: 'طاقة' },
      { value: 'مرباط', label: 'مرباط' },
      { value: 'ثمريت', label: 'ثمريت' },
      { value: 'رخيوت', label: 'رخيوت' },
      { value: 'ضلكوت', label: 'ضلكوت' },
      { value: 'سدح', label: 'سدح' },
      { value: 'شليم وجزر الحلانيات', label: 'شليم وجزر الحلانيات' },
      { value: 'المزيونة', label: 'المزيونة' },
      { value: 'مقشن', label: 'مقشن' },
    ],
    OM_DAK: [
      { value: 'نزوى', label: 'نزوى' },
      { value: 'بهلاء', label: 'بهلاء' },
      { value: 'سمائل', label: 'سمائل' },
      { value: 'أدم', label: 'أدم' },
      { value: 'الحمراء', label: 'الحمراء' },
      { value: 'منح', label: 'منح' },
      { value: 'إزكي', label: 'إزكي' },
      { value: 'بدبد', label: 'بدبد' },
    ],
    OM_BAN: [
      { value: 'صحار', label: 'صحار' },
      { value: 'شناص', label: 'شناص' },
      { value: 'لوى', label: 'لوى' },
      { value: 'صحم', label: 'صحم' },
      { value: 'الخابورة', label: 'الخابورة' },
      { value: 'السويق', label: 'السويق' },
    ],
    OM_BAS: [
      { value: 'الرستاق', label: 'الرستاق' },
      { value: 'العوابي', label: 'العوابي' },
      { value: 'نخل', label: 'نخل' },
      { value: 'وادي المعاول', label: 'وادي المعاول' },
      { value: 'بركاء', label: 'بركاء' },
      { value: 'المصنعة', label: 'المصنعة' },
    ],
    OM_SHN: [
      { value: 'إبراء', label: 'إبراء' },
      { value: 'المضيبي', label: 'المضيبي' },
      { value: 'بدية', label: 'بدية' },
      { value: 'القابل', label: 'القابل' },
      { value: 'وادي بني خالد', label: 'وادي بني خالد' },
      { value: 'دماء والطائيين', label: 'دماء والطائيين' },
    ],
    OM_SHS: [
      { value: 'صور', label: 'صور' },
      { value: 'جعلان بني بو حسن', label: 'جعلان بني بو حسن' },
      { value: 'جعلان بني بو علي', label: 'جعلان بني بو علي' },
      { value: 'الكامل والوافي', label: 'الكامل والوافي' },
      { value: 'مصيرة', label: 'مصيرة' },
    ],
    OM_DHA: [
      { value: 'عبري', label: 'عبري' },
      { value: 'ينقل', label: 'ينقل' },
      { value: 'ضنك', label: 'ضنك' },
    ],
    OM_BUR: [
      { value: 'البريمي', label: 'البريمي' },
      { value: 'محضة', label: 'محضة' },
      { value: 'السنينة', label: 'السنينة' },
    ],
    OM_MSN: [
      { value: 'خصب', label: 'خصب' },
      { value: 'بخاء', label: 'بخاء' },
      { value: 'دبا', label: 'دبا' },
      { value: 'مدحاء', label: 'مدحاء' },
    ],
    OM_WUS: [
      { value: 'هيماء', label: 'هيماء' },
      { value: 'محوت', label: 'محوت' },
      { value: 'الدقم', label: 'الدقم' },
      { value: 'الجازر', label: 'الجازر' },
    ],
  },

};

// ─── English Labels ───
const EN: Record<string, string> = {
  // Country
  OM: 'Oman',

  // ── Oman Governorates
  OM_MUS: 'Muscat', OM_DHO: 'Dhofar', OM_DAK: 'Ad Dakhiliyah', OM_BAN: 'North Al Batinah',
  OM_BAS: 'South Al Batinah', OM_SHN: 'North Ash Sharqiyah', OM_SHS: 'South Ash Sharqiyah',
  OM_DHA: 'Ad Dhahirah', OM_BUR: 'Al Buraimi', OM_MSN: 'Musandam', OM_WUS: 'Al Wusta',

  // ── Oman Cities
  'السيب': 'Seeb', 'بوشر': 'Bousher', 'مطرح': 'Muttrah', 'العامرات': 'Al Amerat',
  'قريات': 'Quriyat', 'مسقط': 'Muscat',
  'صلالة': 'Salalah', 'طاقة': 'Taqah', 'مرباط': 'Mirbat', 'ثمريت': 'Thumrait',
  'رخيوت': 'Rakhyut', 'ضلكوت': 'Dalkut', 'سدح': 'Sadah',
  'شليم وجزر الحلانيات': 'Shalim & Hallaniyat Islands', 'المزيونة': 'Al Mazyunah', 'مقشن': 'Muqshin',
  'نزوى': 'Nizwa', 'بهلاء': 'Bahla', 'سمائل': 'Samail', 'أدم': 'Adam',
  'الحمراء': 'Al Hamra', 'منح': 'Manah', 'إزكي': 'Izki', 'بدبد': 'Bidbid',
  'صحار': 'Sohar', 'شناص': 'Shinas', 'لوى': 'Liwa', 'صحم': 'Saham',
  'الخابورة': 'Al Khaburah', 'السويق': 'As Suwaiq',
  'الرستاق': 'Rustaq', 'العوابي': 'Al Awabi', 'نخل': 'Nakhal',
  'وادي المعاول': 'Wadi Al Maawil', 'بركاء': 'Barka', 'المصنعة': 'Al Musannah',
  'إبراء': 'Ibra', 'المضيبي': 'Al Mudhaibi', 'بدية': 'Bidiyah', 'القابل': 'Al Qabil',
  'وادي بني خالد': 'Wadi Bani Khalid', 'دماء والطائيين': 'Dima Wa At Taiyyin',
  'صور': 'Sur', 'جعلان بني بو حسن': 'Jalan Bani Bu Hassan',
  'جعلان بني بو علي': 'Jalan Bani Bu Ali', 'الكامل والوافي': 'Al Kamil Wal Wafi',
  'مصيرة': 'Masirah', 'عبري': 'Ibri', 'ينقل': 'Yanqul', 'ضنك': 'Dhank',
  'البريمي': 'Al Buraimi', 'محضة': 'Mahdha', 'السنينة': 'As Sunaynah',
  'خصب': 'Khasab', 'بخاء': 'Bukha', 'دبا': 'Dibba', 'مدحاء': 'Madha',
  'هيماء': 'Haima', 'محوت': 'Mahout', 'الدقم': 'Duqm', 'الجازر': 'Al Jazer',
};

function localize(options: LocationOption[], locale?: string): LocationOption[] {
  if (locale !== 'en') return options;
  return options.map(o => ({ value: o.value, label: EN[o.value] ?? o.label }));
}

// ─── Helper Functions ───

export function getCountries(locale?: string): LocationOption[] {
  return localize(countries, locale);
}

export function getGovernorates(countryCode: string, locale?: string): LocationOption[] {
  return localize(governorates[countryCode] ?? [], locale);
}

export function getCities(countryCode: string, governorateCode: string, locale?: string): LocationOption[] {
  return localize(cities[countryCode]?.[governorateCode] ?? [], locale);
}

export function getCountryLabel(code: string, locale?: string): string {
  if (locale === 'en' && EN[code]) return EN[code];
  return countries.find(c => c.value === code)?.label ?? code;
}

export function getGovernorateLabel(countryCode: string, govCode: string, locale?: string): string {
  if (locale === 'en' && EN[govCode]) return EN[govCode];
  return governorates[countryCode]?.find(g => g.value === govCode)?.label ?? govCode;
}

export function getCityLabel(countryCode: string, govCode: string, cityValue: string, locale?: string): string {
  if (locale === 'en' && EN[cityValue]) return EN[cityValue];
  return cities[countryCode]?.[govCode]?.find(c => c.value === cityValue)?.label ?? cityValue;
}

type OmanCityRef = { governorateCode: string; cityValue: string };

let omGovIndex: Map<string, string> | null = null;
let omCityIndex: Map<string, OmanCityRef[]> | null = null;

function normalizePlaceKey(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]/g, '');
}

function addGovCandidate(index: Map<string, string>, candidate: string | undefined, govCode: string) {
  if (!candidate) return;
  const key = normalizePlaceKey(candidate);
  if (key) index.set(key, govCode);
}

function addCityCandidate(index: Map<string, OmanCityRef[]>, candidate: string | undefined, ref: OmanCityRef) {
  if (!candidate) return;
  const key = normalizePlaceKey(candidate);
  if (!key) return;
  const prev = index.get(key) ?? [];
  if (!prev.some((entry) => entry.governorateCode === ref.governorateCode && entry.cityValue === ref.cityValue)) {
    prev.push(ref);
    index.set(key, prev);
  }
}

function getOmanGovIndex(): Map<string, string> {
  if (omGovIndex) return omGovIndex;
  const index = new Map<string, string>();
  const omGovernorates = governorates.OM ?? [];

  for (const gov of omGovernorates) {
    addGovCandidate(index, gov.value, gov.value);
    addGovCandidate(index, gov.label, gov.value);
    addGovCandidate(index, EN[gov.value], gov.value);
  }

  omGovIndex = index;
  return index;
}

function getOmanCityIndex(): Map<string, OmanCityRef[]> {
  if (omCityIndex) return omCityIndex;
  const index = new Map<string, OmanCityRef[]>();
  const omCities = cities.OM ?? {};

  for (const [govCode, cityOptions] of Object.entries(omCities)) {
    for (const city of cityOptions) {
      const ref = { governorateCode: govCode, cityValue: city.value };
      addCityCandidate(index, city.value, ref);
      addCityCandidate(index, city.label, ref);
      addCityCandidate(index, EN[city.value], ref);
    }
  }

  omCityIndex = index;
  return index;
}

function findOmanGovernorateCode(input?: string | null): string | undefined {
  if (!input) return undefined;
  const key = normalizePlaceKey(input);
  if (!key) return undefined;
  return getOmanGovIndex().get(key);
}

function findOmanCityRef(input?: string | null, preferredGovCode?: string): OmanCityRef | undefined {
  if (!input) return undefined;
  const key = normalizePlaceKey(input);
  if (!key) return undefined;
  const matches = getOmanCityIndex().get(key);
  if (!matches || matches.length === 0) return undefined;
  if (preferredGovCode) {
    return matches.find((m) => m.governorateCode === preferredGovCode) ?? matches[0];
  }
  return matches[0];
}

function splitLocationParts(input: string): string[] {
  return input
    .split(/[،,|/>\\]+|\s+-\s+/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function findOmanGovernorateCodeInText(input?: string | null): string | undefined {
  if (!input) return undefined;
  const direct = findOmanGovernorateCode(input);
  if (direct) return direct;

  for (const part of splitLocationParts(input)) {
    const partGov = findOmanGovernorateCode(part);
    if (partGov) return partGov;
    const cityRef = findOmanCityRef(part);
    if (cityRef) return cityRef.governorateCode;
  }

  const normalized = normalizePlaceKey(input);
  const omGovernorates = governorates.OM ?? [];
  for (const gov of omGovernorates) {
    const candidates = [gov.value, gov.label, EN[gov.value]].filter(Boolean);
    if (candidates.some((candidate) => normalized.includes(normalizePlaceKey(candidate)))) {
      return gov.value;
    }
  }

  return undefined;
}

export function resolveOmanLocationLabels(
  governorateInput?: string | null,
  cityInput?: string | null,
  locale?: string
): { governorateCode?: string; governorateLabel?: string; cityLabel?: string } {
  const rawGovernorate = governorateInput?.trim();
  const rawCity = cityInput?.trim();

  let governorateCode = findOmanGovernorateCode(rawGovernorate);
  const cityRef = findOmanCityRef(rawCity, governorateCode);

  if (!governorateCode && cityRef) {
    governorateCode = cityRef.governorateCode;
  }

  const governorateLabel = governorateCode
    ? getGovernorateLabel('OM', governorateCode, locale)
    : (rawGovernorate ? getGovernorateLabel('OM', rawGovernorate, locale) : undefined);

  const cityLabel = cityRef
    ? getCityLabel('OM', cityRef.governorateCode, cityRef.cityValue, locale)
    : (rawCity ? (locale === 'en' && EN[rawCity] ? EN[rawCity] : rawCity) : undefined);

  return {
    governorateCode,
    governorateLabel,
    cityLabel,
  };
}

export function resolveLocationLabel(
  value: string | null | undefined,
  locale?: string
): string | undefined {
  if (!value) return undefined;
  const rawValue = value.trim();
  const governorateCode = findOmanGovernorateCodeInText(rawValue);
  if (governorateCode) return getGovernorateLabel('OM', governorateCode, locale);
  const cityRef = findOmanCityRef(rawValue);
  if (cityRef) return getGovernorateLabel('OM', cityRef.governorateCode, locale);
  return rawValue;
}

export function resolveCityLabel(
  cityValue: string | null | undefined,
  locale?: string
): string | undefined {
  if (!cityValue) return undefined;
  if (locale === 'en' && EN[cityValue]) return EN[cityValue];
  return cityValue;
}
