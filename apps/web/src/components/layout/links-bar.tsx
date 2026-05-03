'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useRef, useState, useEffect } from 'react';

interface NavLinkDef {
  href: string;
  label: string;
  icon: string;
}

function useLinks(): NavLinkDef[] {
  const t = useTranslations('common');
  return [
    { href: '/',                label: t('home'),        icon: 'home'            },
    { href: '/motors',          label: t('cars'),        icon: 'directions_car'  },
    { href: '/buses',           label: t('buses'),       icon: 'directions_bus'  },
    { href: '/equipment',       label: t('equipment'),   icon: 'construction'    },
    { href: '/jobs',            label: t('jobs'),        icon: 'work'            },
    { href: '/browse/parts',    label: t('spareParts'),  icon: 'build'           },
    { href: '/browse/services', label: t('carServices'), icon: 'handyman'        },
  ];
}

export function LinksBar() {
  const links    = useLinks();
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd]     = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  /* ── Scroll state detection ── */
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = Math.abs(el.scrollLeft);
    setCanScrollStart(scrollLeft > 4);
    setCanScrollEnd(scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scroll = (direction: 'start' | 'end') => {
    const el = scrollRef.current;
    if (!el) return;
    const isRtl = getComputedStyle(el).direction === 'rtl';
    const amount = 200;
    const delta = direction === 'end' ? amount : -amount;
    el.scrollBy({ left: isRtl ? -delta : delta, behavior: 'smooth' });
  };

  return (
    <div className="hidden lg:block w-full bg-surface-container-lowest dark:bg-surface-container border-b border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-6 relative">

        {/* ── Scroll fade: start ── */}
        {canScrollStart && (
          <div className="absolute start-0 top-0 bottom-0 z-10 flex items-center">
            <div className="w-16 h-full bg-gradient-to-e from-surface-container-lowest dark:from-surface-container to-transparent pointer-events-none absolute inset-0" />
            <button
              onClick={() => scroll('start')}
              className="relative z-10 w-7 h-7 rounded-full border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container shadow-sm flex items-center justify-center text-on-surface-variant hover:shadow-md hover:scale-105 transition-all ms-1"
            >
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
        )}

        {/* ── Scroll fade: end ── */}
        {canScrollEnd && (
          <div className="absolute end-0 top-0 bottom-0 z-10 flex items-center">
            <div className="w-16 h-full bg-gradient-to-s from-surface-container-lowest dark:from-surface-container to-transparent pointer-events-none absolute inset-0" style={{ direction: 'rtl' }} />
            <button
              onClick={() => scroll('end')}
              className="relative z-10 w-7 h-7 rounded-full border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container shadow-sm flex items-center justify-center text-on-surface-variant hover:shadow-md hover:scale-105 transition-all me-1"
            >
              <span className="material-symbols-outlined text-[14px]">chevron_left</span>
            </button>
          </div>
        )}

        {/* ── Scrollable links ── */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-6 overflow-x-auto no-scrollbar py-2"
        >
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group flex flex-col items-center gap-1 px-1 pb-2 pt-2 shrink-0 transition-all duration-200 border-b-2 whitespace-nowrap ${
                  active
                    ? 'border-on-surface text-on-surface'
                    : 'border-transparent text-on-surface-variant/60 hover:text-on-surface-variant hover:border-outline-variant/30'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[22px] transition-all duration-200 ${
                    active ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'
                  }`}
                  style={{
                    fontVariationSettings: active
                      ? "'FILL' 1, 'wght' 500"
                      : "'FILL' 0, 'wght' 400",
                  }}
                >
                  {link.icon}
                </span>
                <span className={`text-[11px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
