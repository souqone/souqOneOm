'use client';

import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { LEGAL_CONFIG } from '@/lib/legal-config';
import { InstagramIcon } from '@/components/icons/InstagramIcon';

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-on-surface-variant hover:text-on-surface hover:underline transition-colors text-[13px]"
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
    <footer className="bg-surface-container-low dark:bg-surface-container w-full border-t border-outline-variant/20 dark:border-outline-variant/15">

      {/* Desktop view (hidden below lg) */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 lg:px-10 py-[30px]">

        {/* Top row */}
        <div className="flex items-start justify-between gap-10">

          {/* Brand */}
          <div className="shrink-0 max-w-[240px]">
            <Link href="/" className="flex items-center mb-2">
              {locale === 'ar' ? (
                <Image src="/souq-one-ar.svg" alt={t('siteName')} width={130} height={26} className="h-[26px] w-auto dark:hidden" />
              ) : (
                <Image src="/souq-one-en.svg" alt={t('siteName')} width={110} height={22} className="h-[22px] w-auto object-contain dark:hidden" />
              )}
              {locale === 'ar' ? (
                <Image src="/souq-one-ar-dark.svg" alt={t('siteName')} width={130} height={26} className="h-[26px] w-auto hidden dark:block" />
              ) : (
                <Image src="/souq-one-en-dark.svg" alt={t('siteName')} width={110} height={22} className="h-[22px] w-auto object-contain hidden dark:block" />
              )}
            </Link>
            <p className="text-on-surface-variant text-[12.5px] leading-relaxed">
              {t('platformTagline')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-on-surface font-bold text-[13px] mb-2">{tf('quickLinks')}</h4>
            <ul className="space-y-1.5">
              {quickLinks.map((link) => (
                <FooterLink key={link.label} href={link.href}>{link.label}</FooterLink>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-on-surface font-bold text-[13px] mb-2">{tf('servicesLinks')}</h4>
            <ul className="space-y-1.5">
              {servicesLinks.map((link) => (
                <FooterLink key={link.label} href={link.href}>{link.label}</FooterLink>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-on-surface font-bold text-[13px] mb-2">{tf('contactUs')}</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-[16px] shrink-0">mail</span>
                <a
                  href={`mailto:${LEGAL_CONFIG.supportEmail}`}
                  className="text-on-surface-variant hover:text-on-surface text-[12.5px] transition-colors focus-visible:underline focus-visible:ring-2 focus-visible:ring-primary/40 rounded px-0.5"
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
                  className="flex items-center gap-2 text-on-surface-variant hover:text-pink-600 dark:hover:text-pink-400 text-[12.5px] transition-colors focus-visible:underline focus-visible:ring-2 focus-visible:ring-primary/40 rounded px-0.5"
                >
                  <InstagramIcon className="w-4 h-4 text-on-surface-variant/80 hover:text-pink-600 transition-colors" />
                  <span dir="ltr">@souqone.om</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-outline-variant/20 dark:border-outline-variant/15 mt-6 pt-3">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[12.5px] text-on-surface-variant/80">
            <p>
              © {new Date().getFullYear()} {t('siteName')}. {tf('allRightsReserved')}.
            </p>
            <span className="text-outline-variant hidden sm:inline">|</span>
            <Link href="/privacy" className="hover:underline hover:text-on-surface transition-colors">
              {locale === 'ar' ? 'الخصوصية' : 'Privacy'}
            </Link>
            <Link href="/terms" className="hover:underline hover:text-on-surface transition-colors">
              {locale === 'ar' ? 'الشروط والأحكام' : 'Terms'}
            </Link>
            <Link href="/delete-account" className="hover:underline hover:text-on-surface transition-colors">
              {locale === 'ar' ? 'حذف الحساب' : 'Delete Account'}
            </Link>
          </div>
          {locale === 'ar' ? (
            <Image src="/souq-one-ar.svg" alt="سوق ون" width={64} height={13} className="h-[13px] w-auto opacity-40 dark:hidden" />
          ) : (
            <Image src="/souq-one-en.svg" alt="Souqone" width={74} height={15} className="h-[15px] w-auto object-contain opacity-40 dark:hidden" />
          )}
          {locale === 'ar' ? (
            <Image src="/souq-one-ar-dark.svg" alt="سوق ون" width={64} height={13} className="h-[13px] w-auto opacity-40 hidden dark:block" />
          ) : (
            <Image src="/souq-one-en-dark.svg" alt="Souqone" width={74} height={15} className="h-[15px] w-auto object-contain opacity-40 hidden dark:block" />
          )}
        </div>

      </div>

      {/* Mobile compact legal and contact bar (visible below lg, hidden on lg and above) */}
      <div className="block lg:hidden px-4 py-5 pb-24 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12.5px] text-on-surface-variant mb-2.5">
          <Link href="/privacy" className="hover:underline hover:text-on-surface transition-colors">
            {locale === 'ar' ? 'الخصوصية' : 'Privacy'}
          </Link>
          <span className="text-outline-variant">•</span>
          <Link href="/terms" className="hover:underline hover:text-on-surface transition-colors">
            {locale === 'ar' ? 'الشروط والأحكام' : 'Terms'}
          </Link>
          <span className="text-outline-variant">•</span>
          <Link href="/delete-account" className="hover:underline hover:text-on-surface transition-colors">
            {locale === 'ar' ? 'حذف الحساب' : 'Delete Account'}
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12.5px] text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-on-surface-variant">mail</span>
            <a
              href={`mailto:${LEGAL_CONFIG.supportEmail}`}
              className="hover:underline hover:text-on-surface font-medium"
            >
              <bdi dir="ltr">{LEGAL_CONFIG.supportEmail}</bdi>
            </a>
          </div>
          <span className="text-outline-variant">•</span>
          <a
            href={LEGAL_CONFIG.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={tf('instagramAria')}
            className="inline-flex items-center gap-1.5 hover:underline hover:text-pink-600 dark:hover:text-pink-400 font-medium transition-colors"
          >
            <InstagramIcon className="w-3.5 h-3.5 text-on-surface-variant" />
            <span dir="ltr">@souqone.om</span>
          </a>
        </div>
        <p className="text-[12.5px] text-on-surface-variant/80 mt-2">
          © {new Date().getFullYear()} {t('siteName')}. {tf('allRightsReserved')}.
        </p>
      </div>

    </footer>
  );
}
