'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';

const socialLinks = [
  { icon: 'smart_display', label: 'YouTube', href: '#' },
  { icon: 'photo_camera', label: 'Instagram', href: '#' },
  { icon: 'public', label: 'Facebook', href: '#' },
];

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
    { icon: 'location_on', text: tf('address') },
    { icon: 'call', text: tf('phone'), dir: 'ltr' as const },
    { icon: 'mail', text: tf('email') },
  ];

  return (
    <footer className="hidden lg:block bg-[#f4f5f5] dark:bg-neutral-900 w-full border-t border-gray-200 dark:border-neutral-700">

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-[30px]">

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
            {/* Social icons */}
            <div className="flex items-center gap-2 mt-3">
              {socialLinks.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-500 hover:text-gray-700 transition-all">
                  <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                </a>
              ))}
            </div>
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
                  <span dir={item.dir} className="text-gray-500 text-[12px]">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-neutral-700 mt-6 pt-3">
          <p className="text-gray-400 text-[11px]">
            © {new Date().getFullYear()} {t('siteName')}. {tf('allRightsReserved')}.
          </p>
          {locale === 'ar' ? (
            <Image src="/souq-one-ar.svg" alt="سوق وان" width={64} height={13} className="h-[13px] w-auto opacity-40" />
          ) : (
            <Image src="/souq-one-en.svg" alt="SouqOne" width={74} height={15} className="h-[15px] w-auto object-contain opacity-40" />
          )}
        </div>

      </div>
    </footer>
  );
}
