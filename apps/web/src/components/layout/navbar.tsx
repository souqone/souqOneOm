'use client';

import Image from 'next/image';
import { Link, usePathname } from '@/i18n/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/providers/auth-provider';
import { useUnreadCount, useNotifications, useMarkNotificationRead } from '@/lib/api';
import { NotificationDropdown } from './navbar/notification-dropdown';
import { ProfileDropdown } from './navbar/profile-dropdown';
import { MobileDrawer } from './navbar/mobile-drawer';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useAuthModal } from '@/providers/auth-modal-provider';

/* ─────────── Corify heights ─────────── */
const TOP_H  = 56;

export interface NavChild { href: string; label: string; icon: string; desc: string }
export interface NavLinkItem { href: string; label: string; children?: NavChild[] }

function useNavLinks() {
  const t = useTranslations('common');

  const navLinks: NavLinkItem[] = [
    { href: '/', label: t('home') },
    { href: '/cars', label: t('cars') },
    { href: '/buses', label: t('buses') },
    { href: '/equipment', label: t('equipment') },
    { href: '/transport', label: t('transportRequests') },
    { href: '/jobs', label: t('jobs') },
  ];

  const flatNavLinks = [
    { href: '/', label: t('home') },
    { href: '/cars', label: t('cars') },
    { href: '/browse/parts', label: t('spareParts') },
    { href: '/browse/services', label: t('carServices') },
    { href: '/buses', label: t('buses') },
    { href: '/equipment', label: t('equipment') },
    { href: '/transport', label: t('transportRequests') },
    { href: '/jobs', label: t('jobs') },
  ];

  return { navLinks, flatNavLinks };
}

/** Spacer — pushes page content below the fixed navbar */
export function NavbarSpacer() {
  return <div style={{ height: TOP_H }} aria-hidden />;
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { openAuth } = useAuthModal();
  const pathname = usePathname();
  const t = useTranslations('common');
  const locale = useLocale();
  const { navLinks, flatNavLinks } = useNavLinks();

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useUnreadCount();
  const { data: notifData } = useNotifications(1);
  const markNotifRead = useMarkNotificationRead();
  const unreadCount = isAuthenticated ? (unreadData?.count ?? 0) : 0;
  const recentNotifs = notifData?.items?.slice(0, 5) ?? [];

  /* click-outside for dropdowns */
  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  /* body lock */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  /* close mobile on route */
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isActive = useCallback(
    (href: string) => (href === '/' ? pathname === '/' : pathname === href.split('?')[0]),
    [pathname],
  );

  return (
    <>
      <div style={{ height: TOP_H }} aria-hidden />

      {/* Fixed wrapper */}
      <div className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">

        {/* ━━━ TOP BAR: Logo + Links + Actions ━━━ */}
        <div className="glass-nav transition-all duration-300" style={{ height: TOP_H, opacity: 1 }}>

          {/* ── Mobile Top Bar (< lg) ── */}
          <div
            className="lg:hidden grid grid-cols-[1fr_auto_1fr] items-center px-3"
            dir="ltr"
            style={{ height: TOP_H }}
          >
            {/* Physical LEFT: Drawer */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setMobileOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px]">menu</span>
              </button>
            </div>

            {/* CENTER: Logo */}
            <div className="flex justify-center px-2">
              <Link href="/" className="flex items-center">
                {locale === 'ar' ? (
                  <Image src="/souq-one-ar.svg" alt={t('siteName')} width={140} height={28} unoptimized className="h-[28px] w-auto" />
                ) : (
                  <>
                    <Image src="/souq-one-en.svg" alt={t('siteName')} width={120} height={24} unoptimized className="h-[24px] w-auto object-contain dark:hidden" />
                    <Image src="/souq-one-en-dark.svg" alt={t('siteName')} width={120} height={24} unoptimized className="h-[24px] w-auto object-contain hidden dark:block" />
                  </>
                )}
              </Link>
            </div>

            {/* Physical RIGHT: Profile Avatar */}
            <div className="flex justify-end">
              <div className="flex items-center gap-0.5">

                {/* Profile Avatar */}
                {isAuthenticated && user ? (
                  <Link
                    href="/profile"
                    className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary/20 hover:ring-primary/50 transition-all shrink-0 ms-0.5"
                  >
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.displayName || user.username || ''}
                        width={32} height={32}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <span className="text-[12px] font-black text-primary">
                          {(user.displayName || user.username || '?')[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>
                ) : (
                  <button
                    onClick={() => openAuth('login')}
                    className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center ms-0.5 hover:bg-primary/20 transition-all"
                  >
                    <span className="material-symbols-outlined text-primary text-[16px]">person</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Desktop Top Bar (lg+) ── */}
          <div className="hidden lg:grid max-w-7xl mx-auto px-6 grid-cols-[auto_1fr_auto] items-center gap-4" style={{ height: TOP_H }}>
            {/* Brand + Language */}
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/" className="flex items-center">
                {locale === 'ar' ? (
                  <Image src="/souq-one-ar.svg" alt={t('siteName')} width={190} height={38} unoptimized className="h-[32px] sm:h-[38px] w-auto" />
                ) : (
                  <>
                    <Image src="/souq-one-en.svg" alt={t('siteName')} width={158} height={31} unoptimized className="h-[27px] sm:h-[31px] w-auto object-contain dark:hidden" />
                    <Image src="/souq-one-en-dark.svg" alt={t('siteName')} width={158} height={31} unoptimized className="h-[27px] sm:h-[31px] w-auto object-contain hidden dark:block" />
                  </>
                )}
              </Link>
              {/* <LanguageSwitcher /> */}
              <ThemeToggle />
            </div>

            {/* Desktop nav links — center */}
            <div className="hidden lg:flex items-center justify-center">
              <nav className="flex items-center gap-1">
                {navLinks.map(link => {
                  const active = isActive(link.href);
                  return (
                    <div key={link.href} className="relative group/nav">
                      <Link href={link.href} className={`relative flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-lg transition-colors duration-300 ${active ? 'text-primary dark:text-[#FE5E00]' : 'text-on-surface-variant hover:text-primary dark:hover:text-[#FE5E00] hover:bg-surface-container-low/50'}`}>
                        {link.label}
                        <span className={`absolute bottom-0.5 inset-x-3 h-[2px] rounded-full transition-all duration-300 origin-center ${active ? 'bg-primary dark:bg-[#FE5E00] scale-x-100' : 'bg-primary/60 dark:bg-[#FE5E00] scale-x-0 group-hover/nav:scale-x-100'}`} />
                      </Link>
                    </div>
                  );
                })}
              </nav>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-0.5">
              {/* Icon buttons group */}
              <Link href="/favorites" className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-all">
                <span className="material-symbols-outlined text-[20px]">favorite</span>
              </Link>

              {/* Separator */}
              <div className="hidden lg:block w-px h-5 bg-outline-variant/20 mx-1" />

              {/* Auth / User */}
              {isAuthenticated && user ? (
                <>
                  <Link href="/messages" className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-all relative">
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                  </Link>
                  <NotificationDropdown
                    ref={notifRef}
                    open={notifOpen}
                    toggle={() => { setNotifOpen(p => !p); setProfileOpen(false); }}
                    close={() => setNotifOpen(false)}
                    unreadCount={unreadCount}
                    items={recentNotifs}
                    onMarkRead={(id) => markNotifRead.mutate(id)}
                  />
                  <ProfileDropdown
                    ref={profileRef}
                    open={profileOpen}
                    toggle={() => setProfileOpen(p => !p)}
                    close={() => setProfileOpen(false)}
                    user={user}
                    onLogout={logout}
                  />
                </>
              ) : (
                <div className="hidden lg:flex items-center gap-1.5">
                  <button onClick={() => openAuth('login')} className="ghost-border text-primary hover:bg-primary hover:text-on-primary h-9 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">person</span> {t('login')}
                  </button>
                  <button onClick={() => openAuth('register')} className="btn-primary h-9 px-3.5 text-xs font-bold rounded-xl hover:brightness-105 hover:shadow-ambient flex items-center">
                    {t('register')}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      <MobileDrawer
        open={mobileOpen}
        close={() => setMobileOpen(false)}
        navLinks={navLinks}
        flatNavLinks={flatNavLinks}
        isActive={isActive}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={logout}
      />
    </>
  );
}
