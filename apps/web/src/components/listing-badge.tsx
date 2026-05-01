/**
 * Listing type badge component.
 * Displays SALE, RENTAL, or WANTED badges.
 */

import { memo } from 'react';

interface ListingBadgeProps {
  type: string;
}

type BadgeStyle = { label: string; dot: string; cls: string };

const BADGE_MAP: Record<string, BadgeStyle> = {
  // ── Generic ──
  SALE:                   { label: 'للبيع',        dot: 'bg-blue-500',    cls: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
  RENTAL:                 { label: 'إيجار',        dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' },
  WANTED:                 { label: 'مطلوب',        dot: 'bg-orange-500',  cls: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' },
  // ── Bus ──
  BUS_SALE:               { label: 'للبيع',        dot: 'bg-blue-500',    cls: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
  BUS_RENT:               { label: 'للإيجار',      dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' },
  BUS_CONTRACT:           { label: 'تعاقد',        dot: 'bg-purple-500',  cls: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' },
  BUS_SALE_WITH_CONTRACT: { label: 'بيع مع عقد',   dot: 'bg-amber-500',   cls: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
  BUS_REQUEST:            { label: 'طلب تعاقد',    dot: 'bg-rose-500',    cls: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800' },
  // ── Equipment ──
  EQUIPMENT_SALE:         { label: 'للبيع',        dot: 'bg-blue-500',    cls: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
  EQUIPMENT_RENT:         { label: 'للإيجار',      dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' },
  // ── Part & Service ──
  PART:                   { label: 'قطعة غيار',    dot: 'bg-slate-500',   cls: 'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800' },
  SERVICE:                { label: 'خدمة',          dot: 'bg-teal-500',    cls: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800' },
};

const FALLBACK_BADGE: BadgeStyle = BADGE_MAP.SALE;

export const ListingBadge = memo(function ListingBadge({ type }: ListingBadgeProps) {
  const { label, dot, cls } = BADGE_MAP[type] ?? FALLBACK_BADGE;
  return (
    <span className={`px-3 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} inline-block me-1.5`} />
      {label}
    </span>
  );
});
