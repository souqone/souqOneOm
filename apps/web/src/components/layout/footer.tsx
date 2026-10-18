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

/* ── Subcomponents ── */

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

  const contactItems = [
    { icon: 'mail', text: LEGAL_CONFIG.supportEmail, href: `mailto:${LEGAL_CONFIG.supportEmail}` },
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
              {contactItems.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-400 text-[16px] shrink-0">{item.icon}</span>
                  {item.href ? (
                    <a
                      href={item.href}
                      dir="ltr"
                      className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-[12px] transition-colors"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-gray-500 text-[12px]">{item.text}</span>
                  )}
                </li>
              ))}
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
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 dark:text-neutral-400">
          <span className="material-symbols-outlined text-[14px]">mail</span>
          <a
            href={`mailto:${LEGAL_CONFIG.supportEmail}`}
            dir="ltr"
            className="hover:underline hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            {LEGAL_CONFIG.supportEmail}
          </a>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-2">
          © {new Date().getFullYear()} {t('siteName')}. {tf('allRightsReserved')}.
        </p>
      </div>

    </footer>
  );
}
