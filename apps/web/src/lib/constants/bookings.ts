export const BOOKING_STATUS_CONFIG = {
  PENDING: {
    labelKey:   'bookingPending',
    dotColor:   'bg-yellow-400',
    badgeColor: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon:       'schedule',
  },
  CONFIRMED: {
    labelKey:   'bookingConfirmed',
    dotColor:   'bg-green-400',
    badgeColor: 'bg-green-50 text-green-700 border-green-200',
    icon:       'check_circle',
  },
  ACTIVE: {
    labelKey:   'bookingActive',
    dotColor:   'bg-primary',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    icon:       'radio_button_checked',
  },
  COMPLETED: {
    labelKey:   'bookingCompleted',
    dotColor:   'bg-on-surface-variant/30',
    badgeColor: 'bg-surface-container-high text-on-surface-variant border-outline-variant/20',
    icon:       'task_alt',
  },
  CANCELLED: {
    labelKey:   'bookingCancelled',
    dotColor:   'bg-error',
    badgeColor: 'bg-error/10 text-error border-error/20',
    icon:       'cancel',
  },
  REJECTED: {
    labelKey:   'bookingRejected',
    dotColor:   'bg-error',
    badgeColor: 'bg-error/10 text-error border-error/20',
    icon:       'block',
  },
} as const;

export const LISTING_TYPE_CONFIG = {
  CAR:       { icon: 'directions_car', labelKey: 'typeCar',       badgeColor: 'bg-primary/10 text-primary border-primary/20' },
  BUS:       { icon: 'directions_bus', labelKey: 'typeBus',       badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
  EQUIPMENT: { icon: 'construction',   labelKey: 'typeEquipment', badgeColor: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  TRANSPORT: { icon: 'local_shipping', labelKey: 'typeTransport', badgeColor: 'bg-red-500/10 text-red-600 border-red-200' },
} as const;

export const BOOKING_TABS = [
  { key: 'all',       labelKey: 'tabAll',       statuses: null },
  { key: 'upcoming',  labelKey: 'tabUpcoming',  statuses: ['PENDING', 'CONFIRMED'] },
  { key: 'active',    labelKey: 'tabActive',    statuses: ['ACTIVE'] },
  { key: 'completed', labelKey: 'tabCompleted', statuses: ['COMPLETED'] },
  { key: 'cancelled', labelKey: 'tabCancelled', statuses: ['CANCELLED'] },
] as const;

export type BookingTabKey = (typeof BOOKING_TABS)[number]['key'];
