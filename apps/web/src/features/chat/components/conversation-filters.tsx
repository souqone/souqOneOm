'use client';

import { useTranslations } from 'next-intl';

interface ConversationFiltersProps {
  active: string;
  onChange: (filter: string) => void;
  inHeader?: boolean;
}

export function ConversationFilters({ active, onChange, inHeader }: ConversationFiltersProps) {
  const tp = useTranslations('pages');
  const FILTERS = [
    { key: 'all', label: tp('chatFilterAll') },
    { key: 'buying', label: tp('chatFilterBuying') },
    { key: 'selling', label: tp('chatFilterSelling') },
    { key: 'archived', label: tp('chatFilterArchived') },
  ];
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {FILTERS.map(f => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all duration-200 ${
            inHeader
              ? active === f.key
                ? 'bg-white text-primary shadow-sm'
                : 'bg-white/15 text-white/80 hover:bg-white/25'
              : active === f.key
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant/60 hover:bg-surface-container-high hover:text-on-surface-variant'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
