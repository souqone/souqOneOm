'use client'

import type { PaginationMeta } from '../types/filters.types'

interface ResultsMetaProps {
  meta: PaginationMeta | undefined
  isLoading: boolean
  activeFilterCount: number
  labelAr: string
}

export function ResultsMeta({ meta, isLoading, activeFilterCount, labelAr }: ResultsMetaProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-sm font-black text-on-surface">
          {isLoading
            ? 'جاري التحميل...'
            : meta
            ? `${meta.total.toLocaleString('en-US')} ${labelAr}`
            : ''}
        </p>
        {activeFilterCount > 0 && (
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            {activeFilterCount} {activeFilterCount === 1 ? 'فلتر نشط' : 'فلاتر نشطة'}
          </p>
        )}
      </div>
    </div>
  )
}
