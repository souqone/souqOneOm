import type { ListingCategory } from '../types/category.types'
import type { SliderConfig } from './types'

export type { SliderItem, SliderConfig } from './types'

export { CAR_SLIDER_ITEMS } from './cars'
export { SERVICE_SLIDER_ITEMS } from './services'
export { BUS_SLIDER_ITEMS } from './buses'
export { EQUIPMENT_SLIDER_ITEMS } from './equipment'
export { PARTS_SLIDER_ITEMS } from './parts'
export { JOBS_SLIDER_ITEMS } from './jobs'

import { CAR_SLIDER_ITEMS } from './cars'
import { SERVICE_SLIDER_ITEMS } from './services'
import { BUS_SLIDER_ITEMS } from './buses'
import { EQUIPMENT_SLIDER_ITEMS } from './equipment'
import { PARTS_SLIDER_ITEMS } from './parts'

export const CATEGORY_SLIDER_MAP: Partial<Record<ListingCategory, SliderConfig>> = {
  cars:      { items: CAR_SLIDER_ITEMS,       title: 'تصفح حسب الماركة',      defaultFilterKey: 'make' },
  buses:     { items: BUS_SLIDER_ITEMS,       title: 'تصفح حسب النوع',        defaultFilterKey: 'busType' },
  equipment: { items: EQUIPMENT_SLIDER_ITEMS, title: 'تصفح حسب نوع المعدة',   defaultFilterKey: 'equipmentType' },
  parts:     { items: PARTS_SLIDER_ITEMS,     title: 'تصفح حسب فئة القطعة',   defaultFilterKey: 'partCategory' },
  services:  { items: SERVICE_SLIDER_ITEMS,   title: 'تصفح حسب نوع الخدمة',   defaultFilterKey: 'serviceType' },
}
