'use client';

import { useTranslations } from 'next-intl';
import { ClipboardList, Truck, Star, CheckCircle } from 'lucide-react';

const STEP_CONFIG = [
  { num: 1, icon: ClipboardList, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
  { num: 2, icon: Truck,         color: '#d97706', bg: 'rgba(217,119,6,0.08)'  },
  { num: 3, icon: Star,          color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  { num: 4, icon: CheckCircle,   color: '#16a34a', bg: 'rgba(22,163,74,0.08)'  },
];

export default function HowItWorks() {
  const t = useTranslations('transport.howItWorks');

  return (
    <section className="py-10 sm:py-16" dir="rtl">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16">
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-on-surface)] mb-2">
            {t('title')}
          </h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] max-w-lg mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
          {STEP_CONFIG.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="card-base p-3.5 sm:p-5 flex flex-col gap-2 sm:gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: step.bg }}
                  >
                    <Icon size={20} style={{ color: step.color }} />
                  </div>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: step.color, opacity: 0.25 }}
                  >
                    {step.num}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--color-on-surface)]" style={{ fontWeight: 700 }}>
                  {t(`step${step.num}Title`)}
                </h3>
                <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed">
                  {t(`step${step.num}Desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
