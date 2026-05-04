'use client';

import Link from 'next/link';
import {
  Package,
  Sofa,
  HardHat,
  Container,
  ArrowLeftRight,
  Wrench,
  MapPin,
  Calendar,
  MessageSquare,
  Weight,
} from 'lucide-react';
import type { TransportRequest, TransportServiceType } from '../types';
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_COLORS,
  SERVICE_TYPE_BG_COLORS,
  REQUEST_STATUS_LABELS,
} from '../constants';
import {
  formatBudgetRange,
  formatRelativeDate,
  formatScheduledDate,
  getStatusDotColor,
  getRequestStatusBadgeClass,
} from '@/lib/utils';

const SERVICE_ICONS: Record<TransportServiceType, React.ElementType> = {
  GOODS: Package,
  FURNITURE: Sofa,
  CONSTRUCTION: HardHat,
  HEAVY: Container,
  BACKLOAD: ArrowLeftRight,
  EQUIPMENT: Wrench,
};

interface TransportRequestCardProps {
  request: TransportRequest;
  href?: string;
}

export default function TransportRequestCard({ request, href }: TransportRequestCardProps) {
  const ServiceIcon = SERVICE_ICONS[request.serviceType];
  const iconColor = SERVICE_TYPE_COLORS[request.serviceType];
  const iconBg = SERVICE_TYPE_BG_COLORS[request.serviceType];
  const statusDot = getStatusDotColor(request.status);
  const statusBadgeClass = getRequestStatusBadgeClass(request.status);
  const statusLabel = REQUEST_STATUS_LABELS[request.status];
  const serviceLabel = SERVICE_TYPE_LABELS[request.serviceType];

  const cardContent = (
    <div
      className="card-base card-hover p-4 flex flex-col gap-3 cursor-pointer group"
      dir="rtl"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Service Icon */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: iconBg }}
          >
            <ServiceIcon size={18} style={{ color: iconColor }} />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-[var(--color-on-surface-variant)] truncate block">
              {serviceLabel}
            </span>
            <span className="text-[10px] text-[var(--color-on-surface-muted)] font-mono">
              #{request.id.replace('req-', '')}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 ${statusBadgeClass}`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: statusDot }}
          />
          {statusLabel}
        </span>
      </div>

      {/* Route */}
      <div className="flex gap-3">
        {/* Vertical line */}
        <div className="flex flex-col items-center gap-0 pt-1 flex-shrink-0">
          <div
            className="w-2.5 h-2.5 rounded-full border-2 flex-shrink-0"
            style={{ borderColor: '#16a34a', backgroundColor: '#dcfce7' }}
          />
          <div
            className="w-0 flex-grow border-r-2 border-dashed my-1"
            style={{ borderColor: 'var(--color-brand-amber)', minHeight: '1.5rem' }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full border-2 flex-shrink-0"
            style={{ borderColor: 'var(--color-brand-amber)', backgroundColor: '#fff7ed' }}
          />
        </div>

        {/* Place names */}
        <div className="flex flex-col justify-between gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin size={12} className="text-[var(--color-brand-green)] flex-shrink-0" />
            <span className="text-sm font-bold text-[var(--color-on-surface)] truncate">
              {request.fromGovernorate}
            </span>
            {request.fromCity && request.fromCity !== request.fromGovernorate && (
              <span className="text-xs text-[var(--color-on-surface-muted)] truncate">
                — {request.fromCity}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <MapPin size={12} className="text-[var(--color-brand-amber)] flex-shrink-0" />
            <span className="text-sm font-bold text-[var(--color-on-surface)] truncate">
              {request.toGovernorate}
            </span>
            {request.toCity && request.toCity !== request.toGovernorate && (
              <span className="text-xs text-[var(--color-on-surface-muted)] truncate">
                — {request.toCity}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cargo Bar */}
      <div className="flex items-center justify-between gap-2 bg-[var(--color-surface-container)] rounded-xl px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Package size={13} className="text-[var(--color-on-surface-muted)] flex-shrink-0" />
          <span className="text-xs text-[var(--color-on-surface-variant)] truncate">
            {request.cargoDescription}
          </span>
        </div>
        {request.weightTons && (
          <span className="inline-flex items-center gap-1 bg-white border border-[var(--color-outline-variant)] rounded-full px-2 py-0.5 text-[11px] font-bold text-[var(--color-on-surface)] flex-shrink-0">
            <Weight size={10} />
            {request.weightTons} طن
          </span>
        )}
      </div>

      {/* Footer Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Date chip */}
          <span className="inline-flex items-center gap-1 bg-[var(--color-surface-container)] rounded-full px-2.5 py-1 text-[11px] font-semibold text-[var(--color-on-surface-variant)]">
            <Calendar size={11} />
            {request.scheduledAt
              ? formatScheduledDate(request.scheduledAt)
              : formatRelativeDate(request.createdAt)}
          </span>

          {/* Quote count chip */}
          {request._count.quotes > 0 && (
            <span className="inline-flex items-center gap-1 bg-[var(--color-info-light)] rounded-full px-2.5 py-1 text-[11px] font-bold text-[var(--color-info)]">
              <MessageSquare size={11} />
              {request._count.quotes} عروض
            </span>
          )}
          {request._count.quotes === 0 && (
            <span className="inline-flex items-center gap-1 bg-[var(--color-surface-container-high)] rounded-full px-2.5 py-1 text-[11px] font-semibold text-[var(--color-on-surface-muted)]">
              <MessageSquare size={11} />
              لا عروض بعد
            </span>
          )}
        </div>

        {/* Budget */}
        <span className="text-sm font-bold text-[var(--color-brand-navy)] flex-shrink-0">
          {formatBudgetRange(request.budgetMin, request.budgetMax)}
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}