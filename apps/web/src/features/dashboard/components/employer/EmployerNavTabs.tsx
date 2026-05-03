'use client';

import { useTranslations } from 'next-intl';

export type EmployerTab = 'overview' | 'jobs' | 'apps' | 'escrow' | 'invite';

interface TabDef { key: EmployerTab; label: string; icon: string; count: number }

interface EmployerNavTabsProps {
  active: EmployerTab;
  onChange: (tab: EmployerTab) => void;
  counts: { jobs: number; apps: number; escrow: number };
  variant?: 'tabs' | 'sidebar';
  className?: string;
}

export function EmployerNavTabs({ active, onChange, counts, variant = 'tabs', className = '' }: EmployerNavTabsProps) {
  const tp = useTranslations('pages');

  const TABS: TabDef[] = [
    { key: 'overview', label: tp('tabOverview'),  icon: 'grid_view',  count: 0 },
    { key: 'jobs',     label: tp('tabMyJobs'),    icon: 'work',       count: counts.jobs },
    { key: 'apps',     label: tp('tabApps'),      icon: 'people',     count: counts.apps },
    { key: 'escrow',   label: tp('tabPayments'),  icon: 'payments',   count: counts.escrow },
    { key: 'invite',   label: tp('tabInvite'),    icon: 'person_add', count: 0 },
  ];

  if (variant === 'sidebar') {
    return (
      <div className={`bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden w-64 flex-shrink-0 ${className}`}>
        {TABS.map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all
              ${i < TABS.length - 1 ? 'border-b border-outline-variant/[0.06]' : ''}
              ${active === tab.key ? 'bg-primary/5 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            <span className="flex-1 text-right font-medium text-[13px]">{tab.label}</span>
            {tab.count > 0 && (
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black
                ${active === tab.key ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`sticky top-14 z-10 bg-background border-b border-outline-variant/[0.08] ${className}`}>
      <div className="flex overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-1 px-4 py-3 text-[11px] font-semibold
                       whitespace-nowrap border-b-2 flex-shrink-0 transition-all -mb-px
                       ${active === tab.key
                         ? 'border-primary text-primary'
                         : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black
                ${active === tab.key ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
