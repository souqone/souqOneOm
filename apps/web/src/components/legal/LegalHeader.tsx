'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LEGAL_CONFIG } from '@/lib/legal-config';

interface LegalHeaderProps {
  locale: 'ar' | 'en';
}

export function LegalHeader({ locale }: LegalHeaderProps) {
  const pathname = usePathname();
  const isArabic = locale === 'ar';

  // Compute the target URL for the language switcher on this specific page
  const targetLocale = isArabic ? 'en' : 'ar';
  const targetPath = pathname
    ? pathname.replace(new RegExp(`^/${locale}`), `/${targetLocale}`)
    : `/${targetLocale}`;

  const switchLabel = isArabic ? 'English' : 'العربية';
  const backLabel = isArabic ? 'الرئيسية' : 'Home';

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-container-lowest/90 dark:bg-surface-container/90 backdrop-blur-md border-b border-outline-variant/15 transition-colors print:hidden">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4 flex-nowrap">
        {/* Brand / Logo — 44px min touch target */}
        <Link
          href={`/${locale}`}
          className="min-h-[44px] h-[44px] shrink-0 inline-flex items-center px-1 rounded-xl transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={isArabic ? 'الانتقال إلى الرئيسية' : 'Go to Homepage'}
        >
          {isArabic ? (
            <Image
              src="/souq-one-ar.svg"
              alt={LEGAL_CONFIG.brandName.ar}
              width={120}
              height={26}
              className="h-6 w-auto dark:hidden"
            />
          ) : (
            <Image
              src="/souq-one-en.svg"
              alt={LEGAL_CONFIG.brandName.en}
              width={110}
              height={24}
              className="h-5 w-auto object-contain dark:hidden"
            />
          )}
          {isArabic ? (
            <Image
              src="/souq-one-ar-dark.svg"
              alt={LEGAL_CONFIG.brandName.ar}
              width={120}
              height={26}
              className="h-6 w-auto hidden dark:block"
            />
          ) : (
            <Image
              src="/souq-one-en-dark.svg"
              alt={LEGAL_CONFIG.brandName.en}
              width={110}
              height={24}
              className="h-5 w-auto object-contain hidden dark:block"
            />
          )}
        </Link>

        {/* Action Controls — Aligned on same vertical axis, 44px touch targets, no-wrap on 360px */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-nowrap">
          <Link
            href={`/${locale}`}
            className="min-h-[44px] h-[44px] inline-flex items-center justify-center px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {backLabel}
          </Link>

          {/* Language Switcher for this legal page only */}
          <Link
            href={targetPath}
            className="min-h-[44px] h-[44px] inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold text-primary hover:text-primary/85 bg-primary/10 hover:bg-primary/15 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={isArabic ? 'Switch to English' : 'التبديل إلى اللغة العربية'}
          >
            <span className="material-symbols-outlined text-[17px] shrink-0">language</span>
            <span>{switchLabel}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
