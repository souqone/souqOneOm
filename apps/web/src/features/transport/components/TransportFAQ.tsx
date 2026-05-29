'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function TransportFAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const t = useTranslations('transport.faq');
  const FAQS = Array.from({ length: 6 }, (_, i) => ({
    q: t(`q${i + 1}`),
    a: t(`a${i + 1}`),
  }));

  return (
    <section className="py-12 px-4" dir="rtl">
      <h2 className="text-xl font-bold text-center text-[var(--color-on-surface)] mb-6">
        {t('title')}
      </h2>
      <div className="max-w-2xl mx-auto flex flex-col gap-2">
        {FAQS.map((faq, i) => (
          <div key={i} className="card-base overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-right"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span className="font-medium text-sm">{faq.q}</span>
              <ChevronDown
                size={16}
                className={`flex-shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
              />
            </button>
            {open === i && (
              <div className="px-4 pb-4 text-sm text-[var(--color-on-surface-muted)]">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
