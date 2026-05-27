import type { SliderItem } from './types'

export const BUS_SLIDER_ITEMS: SliderItem[] = [
  { name: 'ميني باص',      value: 'MINI_BUS',   icon: 'airport_shuttle',    gradient: 'from-blue-500 to-blue-600' },
  { name: 'حافلة مدرسية',  value: 'SCHOOL_BUS', icon: 'school',             gradient: 'from-amber-500 to-amber-600' },
  { name: 'حافلة متوسطة',  value: 'MEDIUM_BUS', icon: 'directions_bus',     gradient: 'from-green-500 to-green-600' },
  { name: 'حافلة كبيرة',   value: 'LARGE_BUS',  icon: 'directions_transit', gradient: 'from-purple-500 to-purple-600' },
  { name: 'كوستر',         value: 'COASTER',    icon: 'bus_alert',          gradient: 'from-red-500 to-red-600' },
]
