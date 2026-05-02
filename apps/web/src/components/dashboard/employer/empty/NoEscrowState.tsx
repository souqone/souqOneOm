'use client';
import { useTranslations } from 'next-intl';

export function NoEscrowState() {
  const tp = useTranslations('pages');
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center">
        <span className="material-symbols-outlined text-on-surface-variant/30 text-3xl">payments</span>
      </div>
      <p className="font-semibold text-on-surface text-[14px]">{tp('noEscrowTitle')}</p>
      <p className="text-on-surface-variant text-[12px] max-w-xs">{tp('noEscrowDesc')}</p>
    </div>
  );
}
