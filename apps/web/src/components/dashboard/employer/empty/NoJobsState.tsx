'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function NoJobsState() {
  const tp = useTranslations('pages');
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center">
        <span className="material-symbols-outlined text-on-surface-variant/30 text-3xl">work_off</span>
      </div>
      <p className="font-semibold text-on-surface text-[14px]">{tp('noJobsTitle')}</p>
      <p className="text-on-surface-variant text-[12px] max-w-xs">{tp('noJobsDesc')}</p>
      <Button href="/jobs/new" size="sm" className="h-9 px-5 rounded-xl bg-primary text-on-primary text-[12px] font-semibold">
        {tp('createFirstJob')}
      </Button>
    </div>
  );
}
