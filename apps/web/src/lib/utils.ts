import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { TransportRequestStatus, QuoteStatus } from '@/features/transport/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number using Western/Latin digits (en-US) regardless of page locale.
 * Always use this instead of bare .toLocaleString() in Arabic-locale contexts.
 */
export function formatNumber(n: number, opts?: Intl.NumberFormatOptions): string {
  return n.toLocaleString('en-US', opts);
}

export function formatOMR(amount: number): string {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ر.ع.`;
}

export function formatBudgetRange(min?: number, max?: number): string {
  if (!min && !max) return 'السعر قابل للتفاوض';
  if (!min && max) return `حتى ${formatOMR(max)}`;
  if (min && !max) return `من ${formatOMR(min)}`;
  return `${min?.toLocaleString('en-US')} – ${max?.toLocaleString('en-US')} ر.ع.`;
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
  return date.toLocaleDateString('ar-OM-u-nu-latn', { day: 'numeric', month: 'short' });
}

export function formatScheduledDate(dateStr?: string): string {
  if (!dateStr) return 'في أقرب وقت';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / 86400000);
  if (diffDays === 0) return 'اليوم';
  if (diffDays === 1) return 'غداً';
  return date.toLocaleDateString('ar-OM-u-nu-latn', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function getRequestStatusBadgeClass(status: TransportRequestStatus): string {
  const map: Record<TransportRequestStatus, string> = {
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

export function getStatusDotColor(status: TransportRequestStatus): string {
  const map: Record<TransportRequestStatus, string> = {
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

// ── drivershub jobs helpers ──

export const timeAgo = formatRelativeDate;

const SALARY_PERIOD_AR: Record<string, string> = {
  DAILY: 'يومي',
  MONTHLY: 'شهري',
  YEARLY: 'سنوي',
  NEGOTIABLE: 'قابل للتفاوض',
};

export function formatSalary(
  salary?: number | null,
  period?: string | null,
  currency?: string | null,
): string {
  if (!salary) return 'قابل للتفاوض';
  const cur = !currency || currency === 'OMR' ? 'ر.ع.' : currency;
  const per = period ? SALARY_PERIOD_AR[period] ?? period : '';
  return per ? `${salary.toLocaleString('en-US')} ${cur}/${per}` : `${salary.toLocaleString('en-US')} ${cur}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-indigo-600', 'bg-violet-600', 'bg-purple-600',
  'bg-pink-600', 'bg-rose-600', 'bg-orange-600', 'bg-amber-600',
  'bg-emerald-600', 'bg-teal-600', 'bg-cyan-600', 'bg-sky-600',
];

export function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function formatResponseTime(hours?: number): string {
  if (hours === undefined || hours === null) return '';
  if (hours < 1) return 'أقل من ساعة';
  if (hours < 24) return `${Math.round(hours)} ${hours <= 1 ? 'ساعة' : 'ساعات'}`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? 'يوم' : 'أيام'}`;
}
