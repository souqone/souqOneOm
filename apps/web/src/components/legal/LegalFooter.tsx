import React from 'react';
import Link from 'next/link';
import { LEGAL_CONFIG } from '@/lib/legal-config';

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
    <footer className="w-full bg-[#f4f5f5] dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 py-10 px-4 sm:px-6 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top: Operator Notice */}
        <div className="p-4 rounded-2xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/15 text-xs text-on-surface-variant leading-relaxed">
          <p className="font-bold text-on-surface mb-1">
            {isArabic ? 'الجهة المشغلة للمنصة:' : 'Platform Operator:'}
          </p>
          <p>{LEGAL_CONFIG.operatorNotice[locale]}</p>
        </div>

        {/* Middle: Links & Contact */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Legal Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6" aria-label="Legal Links">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors focus:outline-none focus:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Support Email */}
          <div className="text-xs sm:text-sm text-on-surface-variant">
            <span>{isArabic ? 'الدعم الفني: ' : 'Technical Support: '}</span>
            <a
              href={`mailto:${LEGAL_CONFIG.supportEmail}`}
              className="font-bold text-primary hover:underline focus:outline-none"
              dir="ltr"
            >
              {LEGAL_CONFIG.supportEmail}
            </a>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="border-t border-gray-200 dark:border-neutral-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
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
