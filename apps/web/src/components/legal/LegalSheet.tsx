'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

type LegalType = 'terms' | 'privacy'

interface LegalSheetProps {
  type: LegalType
  open: boolean
  onClose: () => void
  onAgree?: () => void
}

const SECTIONS: Record<LegalType, readonly string[]> = {
  terms: ['s1', 's2', 's3', 's4', 's5'] as const,
  privacy: ['s1', 's2', 's3', 's4', 's5', 'contact'] as const,
}

export function LegalSheet({ type, open, onClose, onAgree }: LegalSheetProps) {
  const t = useTranslations(type)

  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const sections = SECTIONS[type]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      />

      <div
        className={clsx(
          'relative w-full sm:max-w-2xl bg-surface-container-lowest dark:bg-surface-container shadow-2xl',
          'rounded-t-3xl sm:rounded-3xl',
          'max-h-[85vh] sm:max-h-[80vh] flex flex-col',
          'animate-in slide-in-from-bottom sm:zoom-in-95 fade-in duration-300',
        )}
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-on-surface-variant/20" />
        </div>

        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-outline-variant/15">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-on-surface">{t('title')}</h2>
            <p className="text-[11px] text-on-surface-variant mt-0.5">{t('lastUpdated')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="close"
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-5">
          {sections.map(s => (
            <section key={s}>
              <h3 className="text-[15px] font-bold text-on-surface mb-2">{t(`${s}Title`)}</h3>
              <p className="text-[13px] sm:text-sm text-on-surface-variant leading-relaxed">
                {t(`${s}Body`)}
              </p>
            </section>
          ))}
        </div>

        <div className="px-5 sm:px-7 py-4 border-t border-outline-variant/15 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end bg-surface-container/40">
          {onAgree && (
            <button
              onClick={() => { onAgree(); onClose() }}
              className="btn-primary order-1 sm:order-2 px-5 py-2.5 rounded-xl text-sm font-bold"
            >
              {t('agree')}
            </button>
          )}
          <button
            onClick={onClose}
            className="order-2 sm:order-1 px-5 py-2.5 rounded-xl text-sm font-bold border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  )
}
