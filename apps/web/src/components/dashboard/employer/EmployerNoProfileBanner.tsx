'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function EmployerNoProfileBanner() {
  const tp = useTranslations('pages');
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center px-6">
      <div className="w-20 h-20 rounded-3xl bg-primary/8 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-4xl">business</span>
      </div>
      <div>
        <h2 className="font-semibold text-on-surface text-lg mb-2">{tp('noEmployerProfileTitle')}</h2>
        <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs">{tp('noEmployerProfileDesc')}</p>
      </div>
      <Button href="/jobs/onboarding" size="md" className="h-11 px-6 rounded-xl bg-primary text-on-primary font-semibold shadow-md shadow-primary/20">
        {tp('createEmployerProfile')}
      </Button>
    </div>
  );
}
