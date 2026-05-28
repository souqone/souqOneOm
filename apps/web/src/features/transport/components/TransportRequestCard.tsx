'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Package, Sofa, HardHat, Container, ArrowLeftRight, Wrench,
  MapPin, Weight, Calendar, MessageSquare, Clock, ChevronLeft,
  Eye, RefreshCw, Loader2,
} from 'lucide-react';
import type { TransportRequest, TransportServiceType } from '../types';
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_COLORS,
  SERVICE_TYPE_BG_COLORS,
  getRequestStatusLabel,
} from '../constants';
import {
  formatBudgetRange,
  formatScheduledDate,
  formatRelativeDate,
  getRequestStatusBadgeClass,
  getStatusDotColor,
} from '@/lib/utils';

const SERVICE_ICONS: Record<TransportServiceType, React.ElementType> = {
  GOODS: Package,
  FURNITURE: Sofa,
  CONSTRUCTION: HardHat,
  HEAVY: Container,
  BACKLOAD: ArrowLeftRight,
  EQUIPMENT: Wrench,
};

interface Props {
  request: TransportRequest;
  onRenew?: (id: string) => void;
  renewing?: boolean;
}

export default function TransportRequestCard({ request, onRenew, renewing }: Props) {
  const t = useTranslations();
  const ServiceIcon = SERVICE_ICONS[request.serviceType] ?? Package;
  const iconColor = SERVICE_TYPE_COLORS[request.serviceType] ?? '#9ca3af';
  const iconBg = SERVICE_TYPE_BG_COLORS[request.serviceType] ?? '#f3f4f6';
  const statusBadgeClass = getRequestStatusBadgeClass(request.status);
  const statusLabel = getRequestStatusLabel(request.status, t);
  const dotColor = getStatusDotColor(request.status);
  const quotesCount = request.quotesCount ?? request._count?.quotes ?? 0;

  return (
    <Link
      href={`/transport/requests/${request.id}`}
      className="card-base card-hover block p-4"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: iconBg }}
          >
            <ServiceIcon size={18} style={{ color: iconColor }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--color-on-surface)] truncate" style={{ fontWeight: 700 }}>
              {SERVICE_TYPE_LABELS[request.serviceType]}
            </p>
            <p className="text-[11px] text-[var(--color-on-surface-muted)]">
              {formatRelativeDate(request.createdAt)}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${statusBadgeClass}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
          {statusLabel}
        </span>
      </div>

      {/* Route */}
      <div className="flex gap-2.5 mb-3">
        <div className="flex flex-col items-center pt-1 flex-shrink-0">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-green-500 bg-green-50" />
          <div className="w-0 border-r-2 border-dashed border-amber-400 h-6 my-0.5" />
          <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-amber-50" />
        </div>
        <div className="flex flex-col justify-between gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-green-600 flex-shrink-0" />
            <span className="text-sm font-bold text-[var(--color-on-surface)] truncate">
              {request.fromGovernorate}
              {request.fromCity ? ` — ${request.fromCity}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-amber-600 flex-shrink-0" />
            <span className="text-sm font-bold text-[var(--color-on-surface)] truncate">
              {request.toGovernorate}
              {request.toCity ? ` — ${request.toCity}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Cargo */}
      <div className="bg-[var(--color-surface-container)] rounded-xl px-3 py-2 mb-3">
        <p className="text-xs text-[var(--color-on-surface-variant)] line-clamp-2 leading-relaxed">
          {request.cargoDescription || 'لم يتم تحديد وصف للبضاعة'}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {request.weightTons && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-on-surface-muted)]">
              <Weight size={12} />
              {request.weightTons} طن
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-on-surface-muted)]">
            {request.scheduledAt ? <Calendar size={12} /> : <Clock size={12} />}
            {formatScheduledDate(request.scheduledAt)}
          </span>
          {quotesCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-brand-navy)]">
              <MessageSquare size={12} />
              {quotesCount} عرض
            </span>
          )}
          {request.viewCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-on-surface-muted)]">
              <Eye size={12} />
              {request.viewCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-[var(--color-brand-navy)]">
            {formatBudgetRange(request.budgetMin, request.budgetMax)}
          </span>
          <ChevronLeft size={14} className="text-[var(--color-on-surface-muted)]" />
        </div>
      </div>

      {/* Renew action for expired requests */}
      {request.status === 'EXPIRED' && onRenew && (
        <div className="mt-3 pt-3 border-t border-[var(--color-outline-variant)]">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRenew(request.id);
            }}
            disabled={renewing}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-[var(--color-warning)] text-[var(--color-warning)] text-xs font-bold hover:bg-[var(--color-warning)]/10 transition-all disabled:opacity-50"
          >
            {renewing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            تجديد الطلب
          </button>
        </div>
      )}
    </Link>
  );
}
