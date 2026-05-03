import type { TransportServiceType, TransportRequestStatus, QuoteStatus, VehicleType } from './types'

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
