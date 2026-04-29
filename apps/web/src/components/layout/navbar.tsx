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
import { NavSearchBar } from './navbar/search-bar';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useSearch } from '@/providers/search-provider';
import { useAuthModal } from '@/providers/auth-modal-provider';

/* ─────────── Corify heights ─────────── */
const TOP_H  = 56;
const NAV_H  = 46;
const TOTAL  = TOP_H + NAV_H;

export interface NavChild { href: string; label: string; icon: string; desc: string }
export interface NavLinkItem { href: string; label: string; children?: NavChild[] }

function useNavLinks() {
  const t = useTranslations('common');
  const tn = useTranslations('nav');

  const navLinks: NavLinkItem[] = [
    { href: '/', label: t('home') },
    {
      href: '/motors', label: t('cars'),
      children: [
        { href: '/browse/cars', label: t('carsForSale'), icon: 'directions_car', desc: tn('browseNewUsedCars') },
        { href: '/browse/cars?listingType=RENTAL', label: t('carsForRent'), icon: 'car_rental', desc: tn('dailyMonthlyRental') },
        { href: '/browse/parts', label: t('spareParts'), icon: 'settings', desc: tn('originalAlternativeParts') },
        { href: '/browse/services', label: t('carServices'), icon: 'build', desc: tn('maintenanceInspection') },
      ],
    },
    {
      href: '/browse/buses', label: t('buses'),
      children: [
        { href: '/browse/buses', label: t('allBuses'), icon: 'directions_bus', desc: tn('busesSaleRentalContracts') },
        { href: '/browse/buses?type=SALE', label: t('busesForSale'), icon: 'sell', desc: tn('busesForSaleDesc') },
        { href: '/browse/buses?type=RENTAL', label: t('busRental'), icon: 'car_rental', desc: tn('busRentalDesc') },
        { href: '/browse/buses?type=CONTRACT', label: t('transportRequests'), icon: 'request_quote', desc: tn('transportRequestsDesc') },
      ],
    },
    {
      href: '/equipment', label: t('equipment'),
      children: [
        { href: '/browse/equipment', label: t('allEquipment'), icon: 'construction', desc: tn('equipmentSaleRental') },
        { href: '/browse/equipment?listingType=SALE', label: t('sellEquipment'), icon: 'sell', desc: tn('equipmentForSaleDesc') },
        { href: '/browse/equipment?listingType=RENTAL', label: t('rentEquipment'), icon: 'car_rental', desc: tn('equipmentRentalDesc') },
        { href: '/equipment/requests', label: t('requestEquipment'), icon: 'assignment_add', desc: tn('equipmentRequestsDesc') },
        { href: '/equipment/operators', label: t('operators'), icon: 'engineering', desc: tn('equipmentOperatorsDesc') },
      ],
    },
    {
      href: '/jobs', label: t('jobs'),
      children: [
        { href: '/jobs', label: t('jobs'), icon: 'work', desc: tn('browseAllJobs') },
        { href: '/jobs/drivers', label: t('driverJobs'), icon: 'person_search', desc: tn('browseDriverProfiles') },
      ],
    },
  ];

  const flatNavLinks = [
    { href: '/', label: t('home') },
    { href: '/motors', label: t('cars') },
    { href: '/browse/parts', label: t('spareParts') },
    { href: '/browse/services', label: t('carServices') },
    { href: '/browse/buses', label: t('buses') },
    { href: '/equipment', label: t('equipment') },
    { href: '/jobs', label: t('jobs') },
  ];

  return { navLinks, flatNavLinks };
}

/** Spacer — pushes page content below the fixed navbar */
export function NavbarSpacer() {
  return <div style={{ height: TOTAL }} aria-hidden />;
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { openAuth } = useAuthModal();
  const pathname = usePathname();
  const t = useTranslations('common');
  const locale = useLocale();
  const { navLinks, flatNavLinks } = useNavLinks();

  const [profileOpen, setProfileOpen] = useState(false);
  const { searchOpen, setSearchOpen } = useSearch();
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

  /* close mobile + search on route */
  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [pathname, setSearchOpen]);

  const isActive = useCallback(
    (href: string) => (href === '/' ? pathname === '/' : pathname === href.split('?')[0]),
    [pathname],
  );

  return (
    <>
      <div style={{ height: searchOpen ? TOTAL : TOP_H }} className="transition-all duration-300" aria-hidden />

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

            {/* Physical RIGHT: Notifications, Chat, Favorites */}
            <div className="flex justify-end">
              <div className="flex items-center gap-0.5">
                <Link href="/notifications" className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-all relative">
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                  {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
                </Link>
                <Link href="/favorites" className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-all">
                  <span className="material-symbols-outlined text-[20px]">favorite</span>
                </Link>
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
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            {/* Desktop nav links — center */}
            <div className="hidden lg:flex items-center justify-center">
              <nav className="flex items-center gap-1">
                {navLinks.map(link => {
                  const active = isActive(link.href) || link.children?.some(c => isActive(c.href));
                  const hasChildren = link.children && link.children.length > 0;
                  return (
                    <div key={link.href} className="relative group/nav">
                      <Link href={link.href} className={`relative flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-lg transition-colors duration-300 ${active ? 'text-primary dark:text-[#FE5E00]' : 'text-on-surface-variant hover:text-primary dark:hover:text-[#FE5E00] hover:bg-surface-container-low/50'}`}>
                        {link.label}
                        <span className={`absolute bottom-0.5 inset-x-3 h-[2px] rounded-full transition-all duration-300 origin-center ${active ? 'bg-primary dark:bg-[#FE5E00] scale-x-100' : 'bg-primary/60 dark:bg-[#FE5E00] scale-x-0 group-hover/nav:scale-x-100'}`} />
                      </Link>
                      {hasChildren && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200 z-50">
                          <div className="bg-surface-container-lowest dark:bg-surface-container-high border border-outline-variant/15 dark:border-outline-variant/30 shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-w-[260px] rounded-xl py-2 overflow-hidden">
                            {link.children!.map(child => (
                              <Link
                                key={child.label}
                                href={child.href}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors"
                              >
                                <span className="material-symbols-outlined text-[20px] text-primary dark:text-[#FE5E00] shrink-0">{child.icon}</span>
                                <div>
                                  <p className="text-sm font-bold text-on-surface">{child.label}</p>
                                  <p className="text-[11px] text-on-surface-variant">{child.desc}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-0.5">
              {/* Icon buttons group */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`hidden lg:flex w-9 h-9 rounded-xl items-center justify-center transition-all ${
                  searchOpen ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{searchOpen ? 'close' : 'search'}</span>
              </button>
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

        {/* ━━━ SEARCH BAR (bottom row — toggle) ━━━ */}
        <div className={`transition-all duration-300 ${searchOpen ? 'max-h-[60px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`} style={{ paddingTop: searchOpen ? 2 : 0, paddingBottom: searchOpen ? 2 : 0 }}>
          <NavSearchBar
            searchOpen={searchOpen}
            onSearchOpenChange={setSearchOpen}
            onCloseMobile={() => setMobileOpen(false)}
            height={NAV_H}
            navLinks={flatNavLinks}
            isActive={isActive}
          />
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
