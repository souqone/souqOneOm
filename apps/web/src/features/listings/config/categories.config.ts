import type { ListingCategory } from '../types/category.types'
import type { UnifiedListingItem, Badge } from '../types/unified-item.types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function resolvePrice(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === '') return null
  const n = typeof raw === 'string' ? parseFloat(raw) : raw
  return isNaN(n) ? null : n
}

function firstImage(images?: { url: string }[]): string[] {
  return images?.[0]?.url ? [images[0].url] : []
}

// ─── Cars (Listing) ─────────────────────────────────────────────────────────

export function normalizeCar(raw: any): UnifiedListingItem {
  const isRental = raw.listingType === 'RENTAL'
  const isWanted = raw.listingType === 'WANTED'

  const price = isRental
    ? resolvePrice(raw.dailyPrice ?? raw.price)
    : resolvePrice(raw.price)

  const priceLabel = isRental ? '/ يوم' : null

  const primaryBadge: Badge | null = isWanted
    ? { label: 'مطلوب', color: 'orange' }
    : isRental
    ? { label: 'للإيجار', color: 'green' }
    : { label: 'للبيع', color: 'blue' }

  const conditionMap: Record<string, string> = {
    NEW: 'جديد', LIKE_NEW: 'شبه جديد', USED: 'مستعمل',
    GOOD: 'جيد', FAIR: 'مقبول', POOR: 'يحتاج صيانة',
  }
  const conditionColorMap: Record<string, Badge['color']> = {
    NEW: 'green', LIKE_NEW: 'blue', USED: 'blue', GOOD: 'blue', FAIR: 'orange', POOR: 'red',
  }
  const secondaryBadge: Badge | null = raw.condition
    ? { label: conditionMap[raw.condition] ?? raw.condition, color: conditionColorMap[raw.condition] ?? 'blue' }
    : null

  const details = []
  if (raw.year) details.push({ icon: 'Calendar', value: String(raw.year) })
  if (raw.mileage) details.push({ icon: 'Gauge', value: `${Number(raw.mileage).toLocaleString('en-US')} كم` })
  if (raw.transmission) details.push({ icon: 'Settings2', value: raw.transmission === 'AUTOMATIC' ? 'أوتوماتيك' : 'يدوي' })

  return {
    id: raw.id,
    category: 'cars',
    title: raw.title,
    price,
    priceLabel,
    currency: raw.currency ?? 'OMR',
    images: firstImage(raw.images),
    governorate: raw.governorate ?? null,
    createdAt: raw.createdAt,
    viewCount: raw.viewCount,
    primaryBadge,
    secondaryBadge,
    details: details.slice(0, 3),
    href: `/sale/car/${raw.id}`,
    favoriteEntityType: 'LISTING',
  }
}

// ─── Buses ───────────────────────────────────────────────────────────────────

const BUS_TYPE_LABELS: Record<string, string> = {
  BUS_SALE: 'للبيع', BUS_SALE_WITH_CONTRACT: 'بيع بعقد',
  BUS_RENT: 'للإيجار', BUS_CONTRACT: 'تعاقد',
}

export function normalizeBus(raw: any): UnifiedListingItem {
  const price = resolvePrice(raw.price ?? raw.dailyPrice ?? raw.monthlyPrice)
  const priceLabel = !raw.price && raw.dailyPrice ? '/ يوم' : !raw.price && raw.monthlyPrice ? '/ شهر' : null

  const primaryBadge: Badge | null = raw.busListingType
    ? { label: BUS_TYPE_LABELS[raw.busListingType] ?? raw.busListingType, color: 'orange' }
    : null

  const secondaryBadge: Badge | null = raw.withDriver
    ? { label: 'مع سائق', color: 'blue' }
    : null

  const details = []
  if (raw.capacity) details.push({ icon: 'Users', value: `${raw.capacity} راكب` })
  if (raw.make) details.push({ icon: 'Bus', value: raw.make })
  if (raw.year) details.push({ icon: 'Calendar', value: String(raw.year) })

  return {
    id: raw.id,
    category: 'buses',
    title: raw.title,
    price,
    priceLabel,
    currency: raw.currency ?? 'OMR',
    images: firstImage(raw.images),
    governorate: raw.governorate ?? null,
    createdAt: raw.createdAt,
    viewCount: raw.viewCount,
    primaryBadge,
    secondaryBadge,
    details: details.slice(0, 3),
    href: `/sale/bus/${raw.id}`,
    favoriteEntityType: 'BUS_LISTING',
  }
}

// ─── Equipment ───────────────────────────────────────────────────────────────

const EQUIP_TYPE_AR: Record<string, string> = {
  EXCAVATOR: 'حفار', CRANE: 'رافعة', LOADER: 'لودر', BULLDOZER: 'بلدوزر',
  FORKLIFT: 'رافعة شوكية', CONCRETE_MIXER: 'خلاطة', GENERATOR: 'مولد',
  COMPRESSOR: 'ضاغط هواء', SCAFFOLDING: 'سقالات', WELDING_MACHINE: 'ماكينة لحام',
  TRUCK: 'شاحنة', DUMP_TRUCK: 'قلاب', WATER_TANKER: 'صهريج مياه',
  LIGHT_EQUIPMENT: 'معدات خفيفة', OTHER_EQUIPMENT: 'أخرى',
}

export function normalizeEquipment(raw: any): UnifiedListingItem {
  const isRent = raw.listingType === 'EQUIPMENT_RENT'
  const price = resolvePrice(isRent ? (raw.dailyPrice ?? raw.monthlyPrice) : raw.price)
  const priceLabel = isRent ? (raw.dailyPrice ? '/ يوم' : '/ شهر') : null

  const primaryBadge: Badge | null = {
    label: isRent ? 'للإيجار' : 'للبيع',
    color: isRent ? 'green' : 'blue',
  }

  const conditionMap: Record<string, string> = {
    NEW: 'جديد', LIKE_NEW: 'شبه جديد', USED: 'مستعمل', GOOD: 'جيد', FAIR: 'مقبول',
  }
  const conditionColorMap2: Record<string, Badge['color']> = {
    NEW: 'green', LIKE_NEW: 'blue', USED: 'blue', GOOD: 'blue', FAIR: 'orange', POOR: 'red',
  }
  const secondaryBadge: Badge | null = raw.condition
    ? { label: conditionMap[raw.condition] ?? raw.condition, color: conditionColorMap2[raw.condition] ?? 'blue' }
    : null

  const details = []
  if (raw.equipmentType) details.push({ icon: 'Wrench', value: EQUIP_TYPE_AR[raw.equipmentType] ?? raw.equipmentType })
  if (raw.hoursUsed) details.push({ icon: 'Clock', value: `${raw.hoursUsed.toLocaleString('en-US')} ساعة` })
  if (raw.withOperator) details.push({ icon: 'HardHat', value: 'مع مشغّل' })

  return {
    id: raw.id,
    category: 'equipment',
    title: raw.title,
    price,
    priceLabel,
    currency: raw.currency ?? 'OMR',
    images: firstImage(raw.images),
    governorate: raw.governorate ?? null,
    createdAt: raw.createdAt,
    viewCount: raw.viewCount,
    primaryBadge,
    secondaryBadge,
    details: details.slice(0, 3),
    href: `/sale/equipment/${raw.id}`,
    favoriteEntityType: 'EQUIPMENT_LISTING',
  }
}

// ─── Parts ───────────────────────────────────────────────────────────────────

const PART_CAT_AR: Record<string, string> = {
  ENGINE: 'محرك', BODY: 'هيكل', ELECTRICAL: 'كهرباء', SUSPENSION: 'تعليق',
  BRAKES: 'فرامل', INTERIOR: 'داخلية', TIRES: 'إطارات',
  BATTERIES: 'بطاريات', OILS: 'زيوت', ACCESSORIES: 'إكسسوارات',
}

const PART_COND_AR: Record<string, string> = {
  NEW: 'جديد', USED: 'مستعمل', REFURBISHED: 'مجدد',
}

export function normalizePart(raw: any): UnifiedListingItem {
  const primaryBadge: Badge | null = raw.partCategory
    ? { label: PART_CAT_AR[raw.partCategory] ?? raw.partCategory, color: 'purple' }
    : null

  const secondaryBadge: Badge | null = raw.isOriginal
    ? { label: 'قطعة أصلية', color: 'green' }
    : raw.condition
    ? { label: PART_COND_AR[raw.condition] ?? raw.condition, color: 'blue' }
    : null

  const details = []
  if (raw.condition && !raw.isOriginal) details.push({ icon: 'Tag', value: PART_COND_AR[raw.condition] ?? raw.condition })
  if (raw.compatibleMakes?.length) details.push({ icon: 'Car', value: raw.compatibleMakes.slice(0, 2).join('، ') })
  if (raw.yearFrom || raw.yearTo) {
    const yr = [raw.yearFrom, raw.yearTo].filter(Boolean).join(' – ')
    details.push({ icon: 'Calendar', value: yr })
  }

  return {
    id: raw.id,
    category: 'parts',
    title: raw.title,
    price: resolvePrice(raw.price),
    priceLabel: null,
    currency: raw.currency ?? 'OMR',
    images: firstImage(raw.images),
    governorate: raw.governorate ?? null,
    createdAt: raw.createdAt,
    viewCount: raw.viewCount,
    primaryBadge,
    secondaryBadge,
    details: details.slice(0, 3),
    href: `/sale/part/${raw.id}`,
    favoriteEntityType: 'SPARE_PART',
  }
}

// ─── Services ────────────────────────────────────────────────────────────────

const SVC_TYPE_AR: Record<string, string> = {
  MAINTENANCE: 'صيانة', CLEANING: 'تنظيف', INSPECTION: 'فحص',
  BODYWORK: 'سمكرة ودهان', TOWING: 'سحب', MODIFICATION: 'تعديل',
  KEYS_LOCKS: 'مفاتيح وأقفال', ACCESSORIES_INSTALL: 'تركيب إكسسوارات', OTHER_SERVICE: 'أخرى',
}

export function normalizeService(raw: any): UnifiedListingItem {
  const price = resolvePrice(raw.priceFrom ?? raw.priceTo)
  const priceLabel = raw.priceFrom && raw.priceTo ? null : null

  const primaryBadge: Badge | null = raw.serviceType
    ? { label: SVC_TYPE_AR[raw.serviceType] ?? raw.serviceType, color: 'green' }
    : null

  const secondaryBadge: Badge | null = raw.isHomeService
    ? { label: 'خدمة منزلية', color: 'green' }
    : null

  const details = []
  if (raw.providerName) details.push({ icon: 'Building2', value: raw.providerName })
  if (raw.workingDays?.length) details.push({ icon: 'CalendarDays', value: `${raw.workingDays.length} أيام/أسبوع` })
  if (raw.workingHoursOpen && raw.workingHoursClose) details.push({ icon: 'Clock', value: `${raw.workingHoursOpen} – ${raw.workingHoursClose}` })

  return {
    id: raw.id,
    category: 'services',
    title: raw.title,
    price,
    priceLabel,
    currency: raw.currency ?? 'OMR',
    images: firstImage(raw.images),
    governorate: raw.governorate ?? null,
    createdAt: raw.createdAt,
    viewCount: raw.viewCount,
    primaryBadge,
    secondaryBadge,
    details: details.slice(0, 3),
    href: `/sale/service/${raw.id}`,
    favoriteEntityType: 'CAR_SERVICE',
  }
}

// ─── Dispatcher ─────────────────────────────────────────────────────────────

function normalizeJob(raw: any): UnifiedListingItem {
  return {
    id: raw.id,
    category: 'jobs',
    title: raw.title || '',
    price: raw.salary ? Number(raw.salary) : null,
    priceLabel: null,
    currency: raw.currency || 'OMR',
    images: [],
    governorate: raw.governorate ?? null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    primaryBadge: null,
    secondaryBadge: null,
    details: [],
    href: `/jobs/${raw.slug || raw.id}`,
    favoriteEntityType: 'JOB',
  }
}

function normalizeEquipmentRequest(raw: any): UnifiedListingItem {
  return {
    id: raw.id,
    category: 'equipment-requests',
    title: raw.title || '',
    price: raw.budgetMax ? Number(raw.budgetMax) : raw.budgetMin ? Number(raw.budgetMin) : null,
    priceLabel: null,
    currency: raw.currency || 'OMR',
    images: [],
    governorate: raw.governorate ?? null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    primaryBadge: { label: 'طلب معدة', color: 'orange' },
    secondaryBadge: raw.withOperator ? { label: 'مع مشغل', color: 'green' } : null,
    details: [],
    href: `/equipment/requests/${raw.slug || raw.id}`,
    favoriteEntityType: 'EQUIPMENT_REQUEST',
  }
}

function normalizeOperator(raw: any): UnifiedListingItem {
  return {
    id: raw.id,
    category: 'operators',
    title: raw.title || '',
    price: raw.dailyRate ? Number(raw.dailyRate) : raw.hourlyRate ? Number(raw.hourlyRate) : null,
    priceLabel: raw.dailyRate ? 'يومياً' : raw.hourlyRate ? 'ساعة' : null,
    currency: raw.currency || 'OMR',
    images: [],
    governorate: raw.governorate ?? null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    primaryBadge: { label: raw.operatorType || 'مشغل', color: 'purple' },
    secondaryBadge: raw.experienceYears != null ? { label: `${raw.experienceYears} سنة خبرة`, color: 'gray' } : null,
    details: [],
    href: `/equipment/operators/${raw.slug || raw.id}`,
    favoriteEntityType: 'OPERATOR_LISTING',
  }
}

export const NORMALIZERS: Record<ListingCategory, (raw: any) => UnifiedListingItem> = {
  cars: normalizeCar,
  buses: normalizeBus,
  equipment: normalizeEquipment,
  'equipment-requests': normalizeEquipmentRequest,
  operators: normalizeOperator,
  parts: normalizePart,
  services: normalizeService,
  jobs: normalizeJob,
}

export function normalizeItem(category: ListingCategory, raw: any): UnifiedListingItem {
  return NORMALIZERS[category](raw)
}
