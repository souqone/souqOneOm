import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RequestStatus, QuoteStatus, BookingStatus } from '@/features/transport/types';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatOMR(amount: number): string {
  return `${amount.toLocaleString('ar-OM', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ر.ع.`;
}

export function formatBudgetRange(min?: number, max?: number): string {
  if (!min && !max) return 'السعر قابل للتفاوض';
  if (!min && max) return `حتى ${formatOMR(max)}`;
  if (min && !max) return `من ${formatOMR(min)}`;
  return `${min?.toLocaleString('ar-OM')} – ${max?.toLocaleString('ar-OM')} ر.ع.`;
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return date.toLocaleDateString('ar-OM', { day: 'numeric', month: 'short' });
}

export function formatScheduledDate(dateStr?: string): string {
  if (!dateStr) return 'في أقرب وقت';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / 86400000);
  if (diffDays === 0) return 'اليوم';
  if (diffDays === 1) return 'غداً';
  return date.toLocaleDateString('ar-OM', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function getRequestStatusBadgeClass(status: RequestStatus): string {
  const map: Record<RequestStatus, string> = {
    OPEN: 'badge-open',
    QUOTED: 'badge-quoted',
    ACCEPTED: 'badge-accepted',
    IN_PROGRESS: 'badge-in-progress',
    COMPLETED: 'badge-completed',
    CANCELLED: 'badge-cancelled',
    EXPIRED: 'badge-cancelled',
  };
  return map[status] ?? 'badge-completed';
}

export function getQuoteStatusBadgeClass(status: QuoteStatus): string {
  const map: Record<QuoteStatus, string> = {
    PENDING: 'badge-in-progress',
    ACCEPTED: 'badge-open',
    REJECTED: 'badge-cancelled',
    WITHDRAWN: 'badge-completed',
  };
  return map[status] ?? 'badge-completed';
}

export function getBookingStatusBadgeClass(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    ACCEPTED: 'badge-accepted',
    IN_PROGRESS: 'badge-in-progress',
    COMPLETED: 'badge-open',
    CANCELLED: 'badge-cancelled',
  };
  return map[status] ?? 'badge-completed';
}

export function getStatusDotColor(status: RequestStatus): string {
  const map: Record<RequestStatus, string> = {
    OPEN: '#16a34a',
    QUOTED: '#2563eb',
    ACCEPTED: '#7c3aed',
    IN_PROGRESS: '#d97706',
    COMPLETED: '#374151',
    CANCELLED: '#dc2626',
    EXPIRED: '#9ca3af',
  };
  return map[status] ?? '#9ca3af';
}