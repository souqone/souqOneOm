'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { LEGAL_CONFIG } from '@/lib/legal-config';

// Social links placeholder — awaiting official platform accounts
// const socialLinks = [
//   { icon: 'smart_display', label: 'YouTube', href: '#' },
//   { icon: 'photo_camera', label: 'Instagram', href: '#' },
//   { icon: 'public', label: 'Facebook', href: '#' },
// ];

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

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-gray-500 hover:text-gray-900 hover:underline transition-colors text-[13px]"
      >
        {children}
      </Link>
    </li>
  );
}

/* ── Main ── */

export function Footer() {
  const t = useTranslations('common');
  const tf = useTranslations('footer');
  const locale = useLocale();

  const quickLinks = [
    { label: 'الرئيسية',   href: '/' },
    { label: 'السيارات',   href: '/cars' },
    { label: 'الحافلات',   href: '/buses' },
    { label: 'المعدات',    href: '/equipment' },
    { label: 'الوظائف',   href: '/jobs' },
    { label: 'النقل',      href: '/transport/browse' },
  ];

  const servicesLinks = [
    { label: t('carServices'), href: '/browse/services' },
    { label: t('addListing'), href: '/add-listing' },
  ];

  return (
    <footer className="bg-[#f4f5f5] dark:bg-neutral-900 w-full border-t border-gray-200 dark:border-neutral-700">

      {/* Desktop view (hidden below lg) */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 lg:px-10 py-[30px]">

        {/* Top row */}
        <div className="flex items-start justify-between gap-10">

          {/* Brand */}
          <div className="shrink-0 max-w-[240px]">
            <Link href="/" className="flex items-center mb-2">
              {locale === 'ar' ? (
                <Image src="/souq-one-ar.svg" alt={t('siteName')} width={130} height={26} className="h-[26px] w-auto" />
              ) : (
                <Image src="/souq-one-en.svg" alt={t('siteName')} width={110} height={22} className="h-[22px] w-auto object-contain" />
              )}
            </Link>
            <p className="text-gray-400 text-[12px] leading-relaxed">
              {t('platformTagline')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gray-800 dark:text-gray-200 font-bold text-[13px] mb-2">{tf('quickLinks')}</h4>
            <ul className="space-y-1.5">
              {quickLinks.map((link) => (
                <FooterLink key={link.label} href={link.href}>{link.label}</FooterLink>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-gray-800 dark:text-gray-200 font-bold text-[13px] mb-2">{tf('servicesLinks')}</h4>
            <ul className="space-y-1.5">
              {servicesLinks.map((link) => (
                <FooterLink key={link.label} href={link.href}>{link.label}</FooterLink>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gray-800 dark:text-gray-200 font-bold text-[13px] mb-2">{tf('contactUs')}</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400 text-[16px] shrink-0">mail</span>
                <a
                  href={`mailto:${LEGAL_CONFIG.supportEmail}`}
                  className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-[12px] transition-colors"
                >
                  <bdi dir="ltr">{LEGAL_CONFIG.supportEmail}</bdi>
                </a>
              </li>
              <li className="flex items-center gap-2">
                <a
                  href={LEGAL_CONFIG.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={tf('instagramAria')}
                  className="flex items-center gap-2 text-gray-500 hover:text-pink-600 dark:hover:text-pink-400 text-[12px] transition-colors"
                >
                  <InstagramIcon className="w-4 h-4 text-gray-400 group-hover:text-pink-600" />
                  <span dir="ltr">@souqone.om</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 dark:border-neutral-700 mt-6 pt-3">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] text-gray-500">
            <p>
              © {new Date().getFullYear()} {t('siteName')}. {tf('allRightsReserved')}.
            </p>
            <span className="text-gray-300 dark:text-neutral-700 hidden sm:inline">|</span>
            <Link href="/privacy" className="hover:underline hover:text-gray-800 dark:hover:text-gray-200">
              {locale === 'ar' ? 'الخصوصية' : 'Privacy'}
            </Link>
            <Link href="/terms" className="hover:underline hover:text-gray-800 dark:hover:text-gray-200">
              {locale === 'ar' ? 'الشروط والأحكام' : 'Terms'}
            </Link>
            <Link href="/delete-account" className="hover:underline hover:text-gray-800 dark:hover:text-gray-200">
              {locale === 'ar' ? 'حذف الحساب' : 'Delete Account'}
            </Link>
          </div>
          {locale === 'ar' ? (
            <Image src="/souq-one-ar.svg" alt="سوق ون" width={64} height={13} className="h-[13px] w-auto opacity-40" />
          ) : (
            <Image src="/souq-one-en.svg" alt="Souqone" width={74} height={15} className="h-[15px] w-auto object-contain opacity-40" />
          )}
        </div>

      </div>

      {/* Mobile compact legal and contact bar (visible below lg, hidden on lg and above) */}
      <div className="block lg:hidden px-4 py-5 pb-24 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-gray-600 dark:text-neutral-400 mb-2.5">
          <Link href="/privacy" className="hover:underline hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            {locale === 'ar' ? 'الخصوصية' : 'Privacy'}
          </Link>
          <span className="text-gray-300 dark:text-neutral-700">•</span>
          <Link href="/terms" className="hover:underline hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            {locale === 'ar' ? 'الشروط والأحكام' : 'Terms'}
          </Link>
          <span className="text-gray-300 dark:text-neutral-700">•</span>
          <Link href="/delete-account" className="hover:underline hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            {locale === 'ar' ? 'حذف الحساب' : 'Delete Account'}
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-gray-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">mail</span>
            <a
              href={`mailto:${LEGAL_CONFIG.supportEmail}`}
              className="hover:underline hover:text-gray-800 dark:hover:text-gray-200 font-medium"
            >
              <bdi dir="ltr">{LEGAL_CONFIG.supportEmail}</bdi>
            </a>
          </div>
          <span className="text-gray-300 dark:text-neutral-700">•</span>
          <a
            href={LEGAL_CONFIG.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={tf('instagramAria')}
            className="inline-flex items-center gap-1.5 hover:underline hover:text-pink-600 dark:hover:text-pink-400 font-medium transition-colors"
          >
            <InstagramIcon className="w-3.5 h-3.5" />
            <span dir="ltr">@souqone.om</span>
          </a>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-2">
          © {new Date().getFullYear()} {t('siteName')}. {tf('allRightsReserved')}.
        </p>
      </div>

    </footer>
  );
}
