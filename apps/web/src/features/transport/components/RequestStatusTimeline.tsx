'use client'

import { useTranslations } from 'next-intl'
import { clsx } from 'clsx'
import type { TransportRequestStatus } from '../types'

const TIMELINE_STEPS: { key: TransportRequestStatus; icon: string }[] = [
  { key: 'OPEN', icon: 'add_circle' },
  { key: 'QUOTED', icon: 'request_quote' },
  { key: 'ACCEPTED', icon: 'handshake' },
  { key: 'IN_PROGRESS', icon: 'local_shipping' },
  { key: 'COMPLETED', icon: 'check_circle' },
]

const STATUS_ORDER: TransportRequestStatus[] = [
  'OPEN',
  'QUOTED',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
]

interface RequestStatusTimelineProps {
  status: TransportRequestStatus
}

export function RequestStatusTimeline({ status }: RequestStatusTimelineProps) {
  const t = useTranslations('transport')

  if (status === 'CANCELLED' || status === 'EXPIRED') {
    return (
      <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
        <span className="material-symbols-outlined text-red-500 text-[24px]">cancel</span>
        <span className="text-[14px] font-bold text-red-700 dark:text-red-400">
          {t(`status.${status}`)}
        </span>
      </div>
    )
  }

  const currentIdx = STATUS_ORDER.indexOf(status)

  return (
    <div className="flex items-center gap-0 mb-6 overflow-x-auto pb-2">
      {TIMELINE_STEPS.map((step, idx) => {
        const isDone = idx <= currentIdx
        const isCurrent = idx === currentIdx
        const isLast = idx === TIMELINE_STEPS.length - 1

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1.5 min-w-[56px]">
              <div
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                  isCurrent
                    ? 'bg-primary text-on-primary shadow-md'
                    : isDone
                      ? 'bg-primary/20 text-primary'
                      : 'bg-surface-container-high text-on-surface-variant/40',
                )}
              >
                <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
              </div>
              <span
                className={clsx(
                  'text-[10px] font-medium text-center leading-tight whitespace-nowrap',
                  isCurrent
                    ? 'text-primary font-bold'
                    : isDone
                      ? 'text-on-surface'
                      : 'text-on-surface-variant/50',
                )}
              >
                {t(`status.${step.key}`)}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={clsx(
                  'flex-1 h-0.5 mx-1',
                  idx < currentIdx ? 'bg-primary/40' : 'bg-outline-variant/20',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
