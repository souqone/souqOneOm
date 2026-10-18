import React from 'react';
import Link from 'next/link';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { InstagramIcon } from '@/components/icons/InstagramIcon';

interface LegalFooterProps {
  locale: 'ar' | 'en';
}

export function LegalFooter({ locale }: LegalFooterProps) {
  const isArabic = locale === 'ar';

  const links = [
    { href: `/${locale}/privacy`, label: isArabic ? 'سياسة الخصوصية' : 'Privacy Policy' },
    { href: `/${locale}/terms`, label: isArabic ? 'الشروط والأحكام' : 'Terms & Conditions' },
    { href: `/${locale}/delete-account`, label: isArabic ? 'حذف الحساب' : 'Delete Account' },
  ];

  return (
    <footer className="w-full bg-surface-container-low dark:bg-surface-container border-t border-outline-variant/20 dark:border-outline-variant/15 py-10 px-4 sm:px-6 transition-colors print:hidden">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top: Operator Notice */}
        <div className="p-4 rounded-2xl bg-surface-container-lowest dark:bg-surface-container-low border border-outline-variant/15 text-[12.5px] text-on-surface-variant leading-[1.7]">
          <p className="font-bold text-on-surface mb-1">
            {isArabic ? 'الجهة المشغلة للمنصة:' : 'Platform Operator:'}
          </p>
          <p>{LEGAL_CONFIG.operatorNotice[locale]}</p>
        </div>

        {/* Middle: Links & Contact */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Legal Navigation Links */}
          <nav
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
            aria-label={isArabic ? 'صفحات قانونية' : 'Legal Pages'}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[12.5px] font-semibold text-on-surface-variant hover:text-primary transition-colors focus-visible:underline focus-visible:ring-2 focus-visible:ring-primary/40 rounded px-1"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Support Email & Instagram */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[12.5px] text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <span>{isArabic ? 'الدعم الفني: ' : 'Technical Support: '}</span>
              <a
                href={`mailto:${LEGAL_CONFIG.supportEmail}`}
                className="font-bold text-primary hover:underline focus-visible:underline focus-visible:ring-2 focus-visible:ring-primary/40 rounded px-1"
              >
                <bdi dir="ltr">{LEGAL_CONFIG.supportEmail}</bdi>
              </a>
            </div>
            <span className="text-outline-variant/40 hidden sm:inline">•</span>
            <a
              href={LEGAL_CONFIG.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={isArabic ? 'تابعنا على إنستجرام' : 'Follow us on Instagram'}
              className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-pink-600 dark:hover:text-pink-400 font-medium transition-colors focus-visible:underline focus-visible:ring-2 focus-visible:ring-primary/40 rounded px-1"
            >
              <InstagramIcon className="w-4 h-4 text-on-surface-variant/80 hover:text-pink-600" />
              <span dir="ltr">@souqone.om</span>
            </a>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="border-t border-outline-variant/20 dark:border-outline-variant/15 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12.5px] text-on-surface-variant/80">
          <p>
            © {new Date().getFullYear()} {LEGAL_CONFIG.brandName[locale]}.{' '}
            {isArabic ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
          <p>{LEGAL_CONFIG.country[locale]}</p>
        </div>
      </div>
    </footer>
  );
}
