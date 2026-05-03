'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { SERVICE_TYPE_ICONS, REQUEST_STATUS_COLORS } from '../constants'
import type { TransportRequest } from '../types'

// ─── Helpers ──────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} د`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} س`
  const days = Math.floor(hours / 24)
  return `${days} ي`
}

// ─── Card ─────────────────────────────────────────

interface TransportRequestCardProps {
  request: TransportRequest
  showActions?: boolean
  onCancel?: (id: string) => void
}

export function TransportRequestCard({ request, showActions, onCancel }: TransportRequestCardProps) {
  const t = useTranslations('transport')

  const icon = SERVICE_TYPE_ICONS[request.serviceType] ?? 'local_shipping'
  const statusColor = REQUEST_STATUS_COLORS[request.status] ?? 'bg-gray-100 text-gray-600'

  return (
    <Link
      href={`/transport/requests/${request.id}`}
      className="block bg-surface-container-lowest dark:bg-surface-container rounded-2xl border border-outline-variant/10 p-4 hover:border-primary/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-200"
    >
      {/* Top row: service icon + status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-amber-600 text-[18px]">{icon}</span>
          </div>
          <span className="text-[13px] font-bold text-on-surface">
            {t(`serviceTypes.${request.serviceType}`)}
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColor}`}>
          {t(`status.${request.status}`)}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-on-surface-variant/60 text-[16px]">location_on</span>
        <span className="text-[13px] text-on-surface truncate">
          {request.fromGovernorate}
        </span>
        <span className="material-symbols-outlined text-on-surface-variant/40 text-[14px]">arrow_forward</span>
        <span className="text-[13px] text-on-surface truncate">
          {request.toGovernorate}
        </span>
      </div>

      {/* Cargo description */}
      <p className="text-[12px] text-on-surface-variant line-clamp-1 mb-3">
        {request.cargoDescription}
      </p>

      {/* Bottom row: budget + time + offers */}
      <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
        <div className="flex items-center gap-3">
          {(request.budgetMin || request.budgetMax) && (
            <span className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">payments</span>
              {request.budgetMin && request.budgetMax
                ? `${request.budgetMin}-${request.budgetMax}`
                : request.budgetMax
                  ? `≤${request.budgetMax}`
                  : `≥${request.budgetMin}`}
              <span className="text-[10px]">ر.ع.</span>
            </span>
          )}
          {request.weightTons && (
            <span className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[14px]">scale</span>
              {request.weightTons} {t('fields.tons')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {typeof request.quotesCount === 'number' && request.quotesCount > 0 && (
            <span className="flex items-center gap-0.5 text-primary font-medium">
              <span className="material-symbols-outlined text-[14px]">request_quote</span>
              {request.quotesCount}
            </span>
          )}
          <span>{timeAgo(request.createdAt)}</span>
        </div>
      </div>

      {/* Optional actions for my-requests page */}
      {showActions && request.status === 'OPEN' && onCancel && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-outline-variant/10">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onCancel(request.id)
            }}
            className="px-3 py-1.5 rounded-full border border-red-300 text-red-600 text-[11px] font-semibold hover:bg-red-50 transition-colors"
          >
            {t('actions.cancelRequest')}
          </button>
        </div>
      )}
    </Link>
  )
}

// ─── Skeleton ─────────────────────────────────────

export function TransportRequestCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl border border-outline-variant/10 p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-surface-container-high" />
          <div className="h-3.5 w-20 bg-surface-container-high rounded" />
        </div>
        <div className="h-5 w-14 bg-surface-container-high rounded-full" />
      </div>
      <div className="h-3 w-3/4 bg-surface-container-high rounded mb-2" />
      <div className="h-3 w-1/2 bg-surface-container-high rounded mb-3" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 bg-surface-container-high rounded" />
        <div className="h-3 w-12 bg-surface-container-high rounded" />
      </div>
    </div>
  )
}
