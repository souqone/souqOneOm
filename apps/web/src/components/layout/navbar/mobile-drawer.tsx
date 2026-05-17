'use client';

import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { NavLinkItem } from '../navbar';
import { getImageUrl } from '@/lib/image-utils';
import { useAuthModal } from '@/providers/auth-modal-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';

interface MobileDrawerProps {
  open: boolean;
  close: () => void;
  navLinks: NavLinkItem[];
  flatNavLinks: { href: string; label: string }[];
  isActive: (href: string) => boolean;
  isAuthenticated: boolean;
  user?: { username: string; displayName?: string | null; email: string; avatarUrl?: string | null } | null;
  onLogout: () => void;
}

export function MobileDrawer({ open, close, navLinks, flatNavLinks: _flatNavLinks, isActive, isAuthenticated, user, onLogout }: MobileDrawerProps) {
  const t = useTranslations('common');
  const locale = useLocale();
  const { openAuth } = useAuthModal();

  const accountLinks = [
    { href: '/profile', icon: 'person', label: t('profile') },
    { href: '/my-listings', icon: 'directions_car', label: t('myListings') },
    { href: '/bookings', icon: 'event_note', label: t('myBookings') },
    { href: '/messages', icon: 'chat', label: t('messages') },
    { href: '/favorites', icon: 'favorite', label: t('favorites') },
    { href: '/profile?tab=settings', icon: 'settings', label: t('settings') },
  ];
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-[300px] sm:w-[340px] bg-surface-container-lowest shadow-2xl flex flex-col transition-transform duration-300 ease-out lg:hidden
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
          <div className="flex items-center">
            {locale === 'ar' ? (
              <Image src="/souq-one-ar.svg" alt={t('siteName')} width={140} height={28} className="h-[28px] w-auto" />
            ) : (
              <>
                <Image src="/souq-one-en.svg" alt={t('siteName')} width={122} height={24} className="h-[24px] w-auto object-contain dark:hidden" />
                <Image src="/souq-one-en-dark.svg" alt={t('siteName')} width={122} height={24} className="h-[24px] w-auto object-contain hidden dark:block" />
              </>
            )}
          </div>
          <button
            onClick={close}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* User card */}
        {isAuthenticated && user && (
          <div className="px-5 py-4 bg-surface-container-low border-b border-outline-variant/20">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <Image src={getImageUrl(user.avatarUrl) || ''} alt={user.displayName || user.username} width={40} height={40} className="w-10 h-10 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-black text-sm shrink-0">
                  {user.username[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-on-surface text-sm truncate">{user.displayName || user.username}</p>
                <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-3">
          <p className="px-5 pt-2 pb-1 text-[11px] font-bold text-outline uppercase tracking-widest">{t('browsing')}</p>
          {navLinks.map(link => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-semibold transition-colors
                  ${active ? 'text-primary bg-primary/5' : 'text-on-surface hover:bg-surface-container-low'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-primary' : 'bg-outline/30'}`} />
                {link.label}
              </Link>
            );
          })}

          {isAuthenticated && user ? (
            <>
              <div className="mt-2 pt-3 border-t border-outline-variant/20">
                <p className="px-5 pb-1 text-[11px] font-bold text-outline uppercase tracking-widest">{t('myAccount')}</p>
                {accountLinks.map(({ href, icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-5 py-3 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-base shrink-0 text-outline">{icon}</span> {label}
                  </Link>
                ))}
              </div>
              <div className="px-5 mt-4">
                <Link href="/add-listing" className="btn-success hover:brightness-110 w-full py-3 flex items-center justify-center gap-2 text-sm font-bold shadow-ambient">
                  <span className="material-symbols-outlined text-sm">add</span> {t('addListingFree')}
                </Link>
              </div>
              <div className="px-5 mt-3">
                <button
                  onClick={() => { onLogout(); close(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-error border border-error/20 rounded-lg hover:bg-error-container/15 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">logout</span> {t('logout')}
                </button>
              </div>
            </>
          ) : (
            <div className="px-5 mt-4 space-y-3">
              <button onClick={() => { close(); openAuth('register'); }} className="bg-primary text-on-primary hover:brightness-110 w-full py-3 flex items-center justify-center text-sm font-bold rounded-lg shadow-ambient">
                {t('createFreeAccount')}
              </button>
              <button
                onClick={() => { close(); openAuth('login'); }}
                className="w-full flex items-center justify-center py-3 text-sm font-bold text-primary border border-primary/25 rounded-lg hover:bg-primary/5 transition-colors"
              >
                {t('login')}
              </button>
            </div>
          )}
        </div>

        {/* Bottom Actions: Theme & Language */}
        <div className="px-5 py-4 border-t border-outline-variant/20 bg-surface-container-low/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{t('settings')}</span>
            <div className="flex items-center gap-2">
              {/* <LanguageSwitcher /> */}
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-outline-variant/20">
          <p className="text-[11px] text-outline text-center">{t('platformTagline')}</p>
        </div>
      </aside>
    </>
  );
}
