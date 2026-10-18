import React from 'react';
import Link from 'next/link';
import { LEGAL_CONFIG } from '@/lib/legal-config';

interface LegalFooterProps {
  locale: 'ar' | 'en';
}

function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={`shrink-0 fill-current ${className}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function LegalFooter({ locale }: LegalFooterProps) {
  const isArabic = locale === 'ar';

  const links = [
    { href: `/${locale}/privacy`, label: isArabic ? 'سياسة الخصوصية' : 'Privacy Policy' },
    { href: `/${locale}/terms`, label: isArabic ? 'الشروط والأحكام' : 'Terms & Conditions' },
    { href: `/${locale}/delete-account`, label: isArabic ? 'حذف الحساب' : 'Delete Account' },
  ];

  return (
    <footer className="w-full bg-[#f4f5f5] dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 py-10 px-4 sm:px-6 transition-colors print:hidden">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top: Operator Notice */}
        <div className="p-4 rounded-2xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/15 text-[12.5px] text-on-surface-variant leading-[1.7]">
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
                className="text-[12.5px] font-semibold text-on-surface-variant hover:text-primary transition-colors focus:outline-none focus:underline"
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
                className="font-bold text-primary hover:underline focus:outline-none"
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
              className="inline-flex items-center gap-1.5 hover:text-pink-600 dark:hover:text-pink-400 font-medium transition-colors"
            >
              <InstagramIcon className="w-4 h-4 text-gray-400 hover:text-pink-600" />
              <span dir="ltr">@souqone.om</span>
            </a>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="border-t border-gray-200 dark:border-neutral-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12.5px] text-gray-500 dark:text-gray-400">
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
