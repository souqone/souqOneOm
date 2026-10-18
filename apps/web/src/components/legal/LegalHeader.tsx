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
    <header className="sticky top-0 z-50 w-full bg-surface-container-lowest/90 dark:bg-surface-container/90 backdrop-blur-md border-b border-outline-variant/15 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg p-1 transition-transform active:scale-95"
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

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}`}
            className="text-xs sm:text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {backLabel}
          </Link>

          {/* Language Switcher for this legal page only */}
          <Link
            href={targetPath}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label={isArabic ? 'Switch to English' : 'التبديل إلى اللغة العربية'}
          >
            <span className="material-symbols-outlined text-[16px]">language</span>
            <span>{switchLabel}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
