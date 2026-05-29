'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Package, Sofa, HardHat, Container, ArrowLeftRight, Wrench,
  MapPin, Weight, Calendar, MessageSquare, Clock, ChevronLeft,
  Eye, RefreshCw, Loader2, Copy, Edit2, XCircle
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
  onRepost?: () => void;
  onDuplicate?: () => void;
  isRenewing?: boolean;
  currentUserId?: string;
  onCancel?: () => void;
  isCancelling?: boolean;
  isConfirmingCancel?: boolean;
}

export default function TransportRequestCard({ request, onRepost, onDuplicate, isRenewing, currentUserId, onCancel, isCancelling, isConfirmingCancel }: Props) {
  const t = useTranslations();
  const isOwner = !!currentUserId && currentUserId === request.userId;
  const canEdit = isOwner && (request.status === 'OPEN' || request.status === 'QUOTED');
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
          {request.cargoDescription || t('noCargoDesc')}
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

      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-[var(--color-outline-variant)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              href={`/transport/requests/${request.id}/edit`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-brand-navy)] text-[var(--color-brand-navy)] text-xs font-bold hover:bg-[var(--color-brand-navy)] hover:text-white transition-all"
            >
              <Edit2 size={14} />
              تعديل
            </Link>
          )}

          {canEdit && onCancel && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCancel();
              }}
              disabled={isCancelling}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all disabled:opacity-50 ${
                isConfirmingCancel
                  ? 'border-[var(--color-error)] bg-red-50 text-[var(--color-error)]'
                  : 'border-[var(--color-error)] text-[var(--color-error)] hover:bg-red-50'
              }`}
            >
              {isCancelling ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <XCircle size={14} />
              )}
              {isConfirmingCancel ? 'تأكيد الإلغاء؟' : 'إلغاء'}
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDuplicate();
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-outline)] text-[var(--color-on-surface-variant)] text-xs font-bold hover:bg-[var(--color-surface-container)] transition-all"
            >
              <Copy size={14} />
              نسخ
            </button>
          )}
        </div>

        {/* Repost action for expired requests */}
        {request.status === 'EXPIRED' && onRepost && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRepost();
            }}
            disabled={isRenewing}
            className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg border border-[var(--color-warning)] text-[var(--color-warning)] text-xs font-bold hover:bg-[var(--color-warning)]/10 transition-all disabled:opacity-50"
          >
            {isRenewing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            إعادة نشر
          </button>
        )}
      </div>
    </Link>
  );
}
