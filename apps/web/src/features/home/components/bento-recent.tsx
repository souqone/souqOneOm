'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const QL_META = [
  { icon: 'electrical_services',   titleKey: 'qlElectrician',   href: '/browse/services?serviceType=MAINTENANCE',         color: 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400' },
  { icon: 'oil_barrel',            titleKey: 'qlOilChange',     href: '/browse/services?serviceType=MAINTENANCE',         color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
  { icon: 'car_crash',             titleKey: 'qlTowing',        href: '/browse/services?serviceType=TOWING',              color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
  { icon: 'tire_repair',           titleKey: 'qlMobileTire',    href: '/browse/services?serviceType=MAINTENANCE',         color: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400' },
  { icon: 'battery_charging_full', titleKey: 'qlBattery',       href: '/browse/services?serviceType=MAINTENANCE',         color: 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' },
  { icon: 'local_car_wash',        titleKey: 'qlCarWash',       href: '/browse/services?serviceType=CLEANING',            color: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400' },
  { icon: 'build',                 titleKey: 'qlMaintenance',   href: '/browse/services?serviceType=MAINTENANCE',         color: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' },
  { icon: 'search_check_2',        titleKey: 'qlInspection',    href: '/browse/services?serviceType=INSPECTION',          color: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400' },
  { icon: 'format_paint',          titleKey: 'qlBodywork',      href: '/browse/services?serviceType=BODYWORK',            color: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' },
  { icon: 'tune',                  titleKey: 'qlModification',  href: '/browse/services?serviceType=MODIFICATION',        color: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' },
  { icon: 'dashboard_customize',   titleKey: 'qlAccessories',   href: '/browse/services?serviceType=ACCESSORIES_INSTALL', color: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400' },
  { icon: 'key',                   titleKey: 'qlKeysLocks',     href: '/browse/services?serviceType=KEYS_LOCKS',          color: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' },
] as const;

const SCROLL_AMOUNT = 240;

export function QuickServicesGrid() {
  const t = useTranslations('home');
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(true);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const isRtl = document.documentElement.dir === 'rtl';
    if (isRtl) {
      setCanScrollEnd(el.scrollLeft < -1);
      setCanScrollStart(el.scrollLeft > -(el.scrollWidth - el.clientWidth - 1));
    } else {
      setCanScrollStart(el.scrollLeft > 1);
      setCanScrollEnd(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  function scroll(direction: 'start' | 'end') {
    const el = trackRef.current;
    if (!el) return;
    const isRtl = document.documentElement.dir === 'rtl';
    const sign = isRtl ? -1 : 1;
    const delta = direction === 'end' ? SCROLL_AMOUNT * sign : -SCROLL_AMOUNT * sign;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-2 sm:pt-3 pb-6 sm:pb-10">
      <div className="flex items-center justify-between mb-5 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-6 sm:h-8 w-1 rounded-full bg-primary" />
          <h2 className="text-base sm:text-xl md:text-3xl font-black tracking-tight">{t('quickServices')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll('start')}
              disabled={!canScrollStart}
              className="w-8 h-8 rounded-full border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container flex items-center justify-center hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Scroll start"
            >
              <ChevronRight size={18} className="text-on-surface" />
            </button>
            <button
              type="button"
              onClick={() => scroll('end')}
              disabled={!canScrollEnd}
              className="w-8 h-8 rounded-full border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container flex items-center justify-center hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Scroll end"
            >
              <ChevronLeft size={18} className="text-on-surface" />
            </button>
          </div>
          <Link href="/browse/services" className="text-primary font-semibold text-xs sm:text-sm hover:underline underline-offset-2 transition-colors">{t('servicesLink')}</Link>
        </div>
      </div>

      <div ref={trackRef} className="flex gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar pb-1 ps-0.5">
        {QL_META.map((link) => (
          <Link
            key={link.titleKey}
            href={link.href}
            className="group shrink-0 flex items-center gap-2 sm:gap-2.5 pe-3 ps-1.5 py-1.5 sm:pe-4 sm:ps-2 sm:py-2 rounded-full bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 hover:border-primary/20 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] active:scale-[0.97] transition-all duration-200"
          >
            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 ${link.color} transition-transform duration-200 group-hover:scale-110`}>
              <span className="material-symbols-outlined text-sm sm:text-lg">{link.icon}</span>
            </div>
            <span className="font-semibold text-[10px] sm:text-xs text-on-surface whitespace-nowrap">{t(link.titleKey)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
