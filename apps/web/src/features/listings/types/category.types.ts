export type ListingCategory =
  | 'cars'
  | 'buses'
  | 'equipment'
  | 'equipment-requests'
  | 'operators'
  | 'parts'
  | 'services'
  | 'jobs'

export const VALID_CATEGORIES: ListingCategory[] = [
  'cars',
  'buses',
  'equipment',
  'equipment-requests',
  'operators',
  'parts',
  'services',
  'jobs',
]

export type CategoryColor =
  | 'blue'
  | 'orange'
  | 'teal'
  | 'purple'
  | 'green'
  | 'amber'
  | 'rose'

export interface CategoryMeta {
  key: ListingCategory
  labelAr: string
  labelEn: string
  /** Lucide icon component name */
  icon: string
  color: CategoryColor
  /** API endpoint prefix e.g. "/listings" */
  apiPath: string
}

export const CATEGORY_META: Record<ListingCategory, CategoryMeta> = {
  cars: {
    key: 'cars',
    labelAr: 'سيارات',
    labelEn: 'Cars',
    icon: 'Car',
    color: 'blue',
    apiPath: '/listings',
  },
  buses: {
    key: 'buses',
    labelAr: 'حافلات',
    labelEn: 'Buses',
    icon: 'Bus',
    color: 'orange',
    apiPath: '/buses',
  },
  equipment: {
    key: 'equipment',
    labelAr: 'معدات',
    labelEn: 'Equipment',
    icon: 'Wrench',
    color: 'teal',
    apiPath: '/equipment',
  },
  'equipment-requests': {
    key: 'equipment-requests',
    labelAr: 'طلبات معدات',
    labelEn: 'Equipment Requests',
    icon: 'Wrench',
    color: 'teal',
    apiPath: '/equipment-requests',
  },
  operators: {
    key: 'operators',
    labelAr: 'مشغلين',
    labelEn: 'Operators',
    icon: 'Briefcase',
    color: 'amber',
    apiPath: '/operators',
  },
  parts: {
    key: 'parts',
    labelAr: 'قطع غيار',
    labelEn: 'Parts',
    icon: 'Settings',
    color: 'purple',
    apiPath: '/parts',
  },
  services: {
    key: 'services',
    labelAr: 'خدمات',
    labelEn: 'Services',
    icon: 'Briefcase',
    color: 'green',
    apiPath: '/services',
  },
  jobs: {
    key: 'jobs',
    labelAr: 'وظائف',
    labelEn: 'Jobs',
    icon: 'Briefcase',
    color: 'amber',
    apiPath: '/jobs',
  },
}

/** Tailwind color map per category — used in UI components */
export const CATEGORY_COLORS: Record<
  CategoryColor,
  { bg: string; text: string; border: string; badgeBg: string; badgeText: string; heroGradient: string }
> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    heroGradient: 'from-[#004ac6] via-[#2563eb] to-[#0B2447]',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    badgeBg: 'bg-orange-100 dark:bg-orange-900/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
    heroGradient: 'from-[#c2410c] via-[#ea580c] to-[#431407]',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
    badgeBg: 'bg-teal-100 dark:bg-teal-900/40',
    badgeText: 'text-teal-700 dark:text-teal-300',
    heroGradient: 'from-[#0f766e] via-[#14b8a6] to-[#042f2e]',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    heroGradient: 'from-[#7e22ce] via-[#9333ea] to-[#2e1065]',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    badgeBg: 'bg-green-100 dark:bg-green-900/40',
    badgeText: 'text-green-700 dark:text-green-300',
    heroGradient: 'from-[#15803d] via-[#16a34a] to-[#052e16]',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    heroGradient: 'from-[#b45309] via-[#d97706] to-[#451a03]',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    heroGradient: 'from-[#be123c] via-[#e11d48] to-[#4c0519]',
  },
}
