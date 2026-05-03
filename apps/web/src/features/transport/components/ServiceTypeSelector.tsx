'use client'

import { useTranslations } from 'next-intl'
import { clsx } from 'clsx'
import { SERVICE_TYPES, SERVICE_TYPE_ICONS } from '../constants'
import type { TransportServiceType } from '../types'

interface ServiceTypeSelectorProps {
  value: TransportServiceType | null
  onChange: (type: TransportServiceType) => void
}

export function ServiceTypeSelector({ value, onChange }: ServiceTypeSelectorProps) {
  const t = useTranslations('transport')

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {SERVICE_TYPES.map((type) => {
        const isSelected = value === type
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={clsx(
              'flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200',
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container hover:border-primary/30',
            )}
          >
            <div
              className={clsx(
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
                isSelected
                  ? 'bg-primary text-on-primary'
                  : 'bg-amber-500/10 text-amber-600',
              )}
            >
              <span className="material-symbols-outlined text-[28px]">
                {SERVICE_TYPE_ICONS[type]}
              </span>
            </div>
            <span
              className={clsx(
                'text-[13px] font-bold text-center',
                isSelected ? 'text-primary' : 'text-on-surface',
              )}
            >
              {t(`serviceTypes.${type}`)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
