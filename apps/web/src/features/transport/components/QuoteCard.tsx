'use client'

import { useTranslations } from 'next-intl'
import { QUOTE_STATUS_COLORS } from '../constants'
import type { TransportQuote } from '../types'

interface QuoteCardProps {
  quote: TransportQuote
  isOwner?: boolean
  onAccept?: (quoteId: string) => void
  onWithdraw?: (quoteId: string) => void
  actionLoading?: boolean
}

export function QuoteCard({ quote, isOwner, onAccept, onWithdraw, actionLoading }: QuoteCardProps) {
  const t = useTranslations('transport')

  const statusColor = QUOTE_STATUS_COLORS[quote.status]
  const carrier = quote.carrier

  return (
    <div className="border border-outline-variant/20 rounded-xl bg-surface-container-lowest dark:bg-surface-container p-4">
      {/* Header: carrier info + status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-[14px] font-bold text-on-surface-variant overflow-hidden">
            {carrier?.user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={carrier.user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (carrier?.companyName ?? carrier?.user?.displayName ?? '?').charAt(0)
            )}
          </div>
          <div>
            <p className="text-[13px] font-bold text-on-surface">
              {carrier?.companyName || carrier?.user?.displayName || carrier?.user?.username || '—'}
            </p>
            {carrier && carrier.completedTrips > 0 && (
              <p className="text-[11px] text-on-surface-variant">
                {carrier.completedTrips} {t('completedTrips')}
                {carrier.averageRating > 0 && ` · ★ ${carrier.averageRating.toFixed(1)}`}
              </p>
            )}
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColor}`}>
          {t(`quoteStatus.${quote.status}`)}
        </span>
      </div>

      {/* Price + estimated hours */}
      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-[18px] font-black text-on-surface">
            {Number(quote.price).toLocaleString('en-US')}
          </span>
          <span className="text-[12px] text-on-surface-variant">ر.ع.</span>
        </div>
        {quote.estimatedHours && (
          <span className="text-[12px] text-on-surface-variant flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {quote.estimatedHours} {t('fields.hours')}
          </span>
        )}
      </div>

      {/* Message */}
      {quote.message && (
        <p className="text-[12px] text-on-surface-variant leading-relaxed mb-3 line-clamp-2">
          {quote.message}
        </p>
      )}

      {/* Actions */}
      {(isOwner && quote.status === 'PENDING' && onAccept) && (
        <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/10">
          <button
            onClick={() => onAccept(quote.id)}
            disabled={actionLoading}
            className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-[13px] font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {t('actions.acceptQuote')}
          </button>
        </div>
      )}

      {(!isOwner && quote.status === 'PENDING' && onWithdraw) && (
        <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/10">
          <button
            onClick={() => onWithdraw(quote.id)}
            disabled={actionLoading}
            className="px-4 py-1.5 rounded-full border border-red-300 text-red-600 text-[12px] font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {t('actions.withdrawQuote')}
          </button>
        </div>
      )}
    </div>
  )
}
