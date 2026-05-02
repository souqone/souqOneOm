'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function DriverVerificationBanner() {
  const tp = useTranslations('pages');

  return (
    <div className="bg-gradient-to-l from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
        <span
          className="material-symbols-outlined text-amber-600 text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          warning
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-amber-900 text-[13px]">{tp('notVerifiedTitle')}</p>
        <p className="text-amber-700 text-[11px] mt-0.5 leading-relaxed">{tp('notVerifiedDesc')}</p>
      </div>
      <Button
        href="/jobs/verify"
        size="xs"
        className="flex-shrink-0 h-9 px-4 rounded-xl bg-amber-500 text-white text-[11px] font-bold shadow-sm shadow-amber-200"
      >
        {tp('verifyNow')}
      </Button>
    </div>
  );
}
