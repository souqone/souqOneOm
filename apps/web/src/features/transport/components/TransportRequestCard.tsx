'use client'

import Link from 'next/link'
import type { TransportRequest } from '../types'

const SERVICE_ICONS: Record<string, string> = {
  GOODS: 'inventory_2',
  FURNITURE: 'chair',
  CONSTRUCTION: 'construction',
  HEAVY: 'precision_manufacturing',
  BACKLOAD: 'swap_horiz',
  EQUIPMENT: 'agriculture',
}

const STATUS_CLASSES: Record<string, string> = {
  OPEN: 'bg-brand-green/10 text-brand-green border border-brand-green/20',
  QUOTED: 'bg-primary/10 text-primary border border-primary/20',
  ACCEPTED: 'bg-primary/10 text-primary border border-primary/20',
  IN_PROGRESS: 'bg-brand-amber/10 text-brand-amber border border-brand-amber/20',
  COMPLETED: 'bg-brand-green/10 text-brand-green border border-brand-green/20',
  CANCELLED: 'bg-error/10 text-error border border-error/20',
  EXPIRED: 'bg-on-surface-variant/10 text-on-surface-variant border border-outline-variant',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'مفتوح',
  QUOTED: 'وصلت عروض',
  ACCEPTED: 'تم القبول',
  IN_PROGRESS: 'جارٍ التنفيذ',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
  EXPIRED: 'منتهي',
}

interface Props {
  request: TransportRequest
}

export default function TransportRequestCard({ request }: Props) {
  const icon = SERVICE_ICONS[request.serviceType] ?? 'local_shipping'
  const statusClass = STATUS_CLASSES[request.status] ?? STATUS_CLASSES.OPEN
  const statusLabel = STATUS_LABELS[request.status] ?? request.status

  const scheduledLabel = request.scheduledAt
    ? new Date(request.scheduledAt).toLocaleDateString('ar-OM', { month: 'short', day: 'numeric' })
    : request.isFlexible
      ? 'مرن'
      : 'أسرع وقت'

  return (
    <Link
      href={`/transport/requests/${request.id}`}
      className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-5 shadow-sm hover:shadow-lg hover:border-outline-variant/20 transition-all flex flex-col gap-4"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="bg-primary-container/10 p-2 rounded-lg text-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
              route
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">المسار</span>
            <span className="font-title-md text-title-md text-on-surface">
              من {request.fromGovernorate} ← إلى {request.toGovernorate}
            </span>
          </div>
        </div>
        <span className={`font-label-md text-label-md px-3 py-1 rounded-full ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      <hr className="border-outline-variant/20 my-2" />

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0" }}>
              {icon}
            </span>
            <span className="font-label-sm text-label-sm">النوع</span>
          </div>
          <span className="font-body-sm text-body-sm text-on-surface">
            {request.cargoDescription.slice(0, 20)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0" }}>
              scale
            </span>
            <span className="font-label-sm text-label-sm">الوزن</span>
          </div>
          <span className="font-body-sm text-body-sm text-on-surface">
            {request.weightTons ? `${request.weightTons} طن` : '—'}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0" }}>
              calendar_month
            </span>
            <span className="font-label-sm text-label-sm">التوقيت</span>
          </div>
          <span className="font-body-sm text-body-sm text-on-surface">{scheduledLabel}</span>
        </div>
      </div>
    </Link>
  )
}
