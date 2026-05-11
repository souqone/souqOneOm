import type { TransportServiceType, TransportRequestStatus, QuoteStatus, VehicleType, BookingStatus } from './types'

// ─── Service Types ────────────────────────────────

export const SERVICE_TYPES: TransportServiceType[] = [
  'GOODS',
  'FURNITURE',
  'CONSTRUCTION',
  'HEAVY',
  'BACKLOAD',
  'EQUIPMENT',
]

// ─── Material Symbols icon names per service type ─

export const SERVICE_TYPE_ICONS: Record<TransportServiceType, string> = {
  GOODS: 'inventory_2',
  FURNITURE: 'weekend',
  CONSTRUCTION: 'construction',
  HEAVY: 'local_shipping',
  BACKLOAD: 'swap_horiz',
  EQUIPMENT: 'precision_manufacturing',
}

// ─── Vehicle Types ────────────────────────────────

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  PICKUP: 'بيك أب',
  VAN: 'فان',
  TRUCK_SMALL: 'شاحنة صغيرة',
  TRUCK_LARGE: 'شاحنة كبيرة',
  TRAILER: 'تريلر',
  EXCAVATOR: 'حفّار',
  TIPPER: 'قلّاب',
  CRANE: 'رافعة',
  OTHER: 'أخرى',
}

// ─── Oman Governorates ────────────────────────────

export const OMAN_GOVERNORATES = [
  'مسقط',
  'ظفار',
  'مسندم',
  'البريمي',
  'الداخلية',
  'شمال الباطنة',
  'جنوب الباطنة',
  'شمال الشرقية',
  'جنوب الشرقية',
  'الظاهرة',
  'الوسطى',
]

export const OMAN_WILAYAT_BY_GOVERNORATE: Record<string, string[]> = {
  'مسقط':          ['مسقط', 'مطرح', 'بوشر', 'العامرات', 'قريات', 'السيب'],
  'ظفار':           ['صلالة', 'طاقة', 'سدح', 'ميربط', 'رخيوت', 'مرباط', 'شليم وحلانيات', 'المزيونة', 'ضلكوت'],
  'مسندم':          ['خصب', 'بخاء', 'دبا', 'مدحاء', 'لوى'],
  'البريمي':         ['البريمي', 'محضة', 'المحلب'],
  'الداخلية':        ['نزوى', 'بهلاء', 'منح', 'إزكي', 'سمائل', 'الحمراء', 'الجبل الأخضر', 'أدم', 'المضيبي'],
  'شمال الباطنة':    ['صحار', 'شناص', 'خابورة', 'صحم', 'السويق', 'نخل', 'وادي المعاول', 'لوى'],
  'جنوب الباطنة':    ['الرستاق', 'البويب', 'عوابي', 'المصنعة', 'بركاء'],
  'شمال الشرقية':    ['إبراء', 'المضيبي', 'دماء والطائيين', 'البدية', 'العقر', 'المنيب'],
  'جنوب الشرقية':    ['صور', 'مصيرة', 'بلهاء', 'الكامل والوافي', 'جعلان بني بوعلي', 'جعلان بني بوحسن'],
  'الظاهرة':         ['عبري', 'ينقل', 'ضنك'],
  'الوسطى':          ['هيماء', 'الدقم', 'محوت', 'الجازر'],
}

export const OMAN_WILAYAT: string[] = Object.values(OMAN_WILAYAT_BY_GOVERNORATE).flat()

// ─── Status Colors ────────────────────────────────

export const REQUEST_STATUS_COLORS: Record<TransportRequestStatus, string> = {
  OPEN: 'bg-green-100 text-green-700',
  QUOTED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
}

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-gray-100 text-gray-500',
}

// ─── Sort Options ─────────────────────────────────

export const SORT_OPTIONS = [
  { value: 'newest', labelKey: 'sortNewest' },
  { value: 'oldest', labelKey: 'sortOldest' },
  { value: 'budgetHigh', labelKey: 'sortBudgetHigh' },
  { value: 'budgetLow', labelKey: 'sortBudgetLow' },
] as const

// ─── Browse Sort Options (for new browse UI) ──────

export const BROWSE_SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'الأحدث أولاً' },
  { value: 'createdAt_asc', label: 'الأقدم أولاً' },
  { value: 'budgetMax_desc', label: 'الميزانية الأعلى' },
  { value: 'budgetMax_asc', label: 'الميزانية الأدنى' },
  { value: 'scheduledAt_asc', label: 'أقرب موعد' },
] as const

// ─── Service Type Labels ──────────────────────────

export const SERVICE_TYPE_LABELS: Record<TransportServiceType, string> = {
  GOODS: 'بضائع عامة',
  FURNITURE: 'أثاث ومنزليات',
  CONSTRUCTION: 'مواد البناء',
  HEAVY: 'شحن ثقيل',
  BACKLOAD: 'عودة فارغة',
  EQUIPMENT: 'معدات وآليات',
}

// ─── Service Type Colors ──────────────────────────

export const SERVICE_TYPE_COLORS: Record<TransportServiceType, string> = {
  GOODS: '#2563eb',
  FURNITURE: '#7c3aed',
  CONSTRUCTION: '#d97706',
  HEAVY: '#dc2626',
  BACKLOAD: '#16a34a',
  EQUIPMENT: '#0891b2',
}

export const SERVICE_TYPE_BG_COLORS: Record<TransportServiceType, string> = {
  GOODS: 'rgba(37, 99, 235, 0.1)',
  FURNITURE: 'rgba(124, 58, 237, 0.1)',
  CONSTRUCTION: 'rgba(217, 119, 6, 0.1)',
  HEAVY: 'rgba(220, 38, 38, 0.1)',
  BACKLOAD: 'rgba(22, 163, 74, 0.1)',
  EQUIPMENT: 'rgba(8, 145, 178, 0.1)',
}

// ─── Request Status Labels ────────────────────────

export const REQUEST_STATUS_LABELS: Record<TransportRequestStatus, string> = {
  OPEN: 'مفتوح',
  QUOTED: 'وصلت عروض',
  ACCEPTED: 'مقبول',
  IN_PROGRESS: 'جارٍ التنفيذ',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
  EXPIRED: 'منتهي الصلاحية',
}

// ─── Quote Status Styles ──────────────────────────

export const QUOTE_STATUS_STYLES: Record<QuoteStatus, { bg: string; text: string; border: string }> = {
  PENDING:   { bg: 'var(--color-warning-light)',        text: 'var(--color-warning)',        border: 'rgba(217,119,6,0.3)'   },
  ACCEPTED:  { bg: 'var(--color-success-light)',        text: 'var(--color-success)',        border: 'rgba(22,163,74,0.3)'   },
  REJECTED:  { bg: 'var(--color-error-light)',          text: 'var(--color-error)',          border: 'rgba(220,38,38,0.3)'   },
  WITHDRAWN: { bg: 'var(--color-surface-container)',    text: 'var(--color-on-surface-muted)', border: 'var(--color-outline)' },
}

// ─── Quote Status Labels ──────────────────────────

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  PENDING: 'بانتظار الرد',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  WITHDRAWN: 'مسحوب',
}

// ─── Booking Status Labels ────────────────────────

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  ACCEPTED: 'تم القبول',
  IN_PROGRESS: 'جارٍ التنفيذ',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
}

// ─── Currency ─────────────────────────────────────

export const CURRENCY_LABEL = 'ر.ع.'

