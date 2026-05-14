'use client';

import { Link } from '@/i18n/navigation';
import {
  Search, Plus,
  Car, Bus, Package, Wrench, Briefcase,
} from 'lucide-react';
import { ListingSearchBar } from '@/components/shared/listing-search-bar';

const HOME_SEARCH_CATS = [
  { key: 'all',       label: 'كل الخدمات',       route: '/cars/browse' },
  { key: 'cars',      label: 'سيارات',            route: '/cars/browse' },
  { key: 'buses',     label: 'حافلات',            route: '/browse/buses' },
  { key: 'equipment', label: 'معدات',             route: '/browse/equipment' },
  { key: 'transport', label: 'نقل',               route: '/transport/browse' },
  { key: 'jobs',      label: 'وظائف',             route: '/jobs' },
  { key: 'parts',     label: 'قطع غيار',          route: '/browse/parts' },
  { key: 'services',  label: 'خدمات السيارات',    route: '/browse/services' },
] as const;

const QUICK_LINKS = [
  { icon: Car,      label: 'سيارات',  href: '/cars/browse' },
  { icon: Bus,      label: 'حافلات',  href: '/browse/buses' },
  { icon: Package,  label: 'معدات',   href: '/browse/equipment' },
  { icon: Wrench,   label: 'قطع',     href: '/browse/parts' },
  { icon: Briefcase, label: 'وظائف', href: '/jobs' },
] as const;

export function HomeHero() {

  return (
    <>
    <section className="relative overflow-hidden gradient-navy text-white">
      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[var(--color-brand-amber)]/10 translate-x-1/4 translate-y-1/4 pointer-events-none" />

      <div
        className="relative max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-4 sm:py-10"
        style={{ paddingTop: '85px' }}
      >
        <div className="max-w-2xl mx-auto lg:mx-0 text-center sm:text-start">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 sm:px-4 py-1.5 mb-4 sm:mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold text-white/90">المنصة العُمانية الأولى للمركبات والمعدات</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Link
              href="/cars/browse"
              className="btn-transport-primary flex-1 sm:flex-none sm:w-auto justify-center sm:justify-start whitespace-nowrap !text-[11px] sm:!text-base !py-2 !px-3 sm:!py-3.5 sm:!px-6"
            >
              <Search size={13} className="sm:hidden" aria-hidden="true" />
              <Search size={18} className="hidden sm:block" aria-hidden="true" />
              تصفّح الإعلانات
            </Link>
            <Link
              href="/cars/new"
              className="btn-outline-white flex-1 sm:flex-none sm:w-auto justify-center sm:justify-start whitespace-nowrap !text-[11px] sm:!text-base !py-2 !px-3 sm:!py-3.5 sm:!px-6"
            >
              أضف إعلانك مجاناً
              <Plus size={13} className="sm:hidden" aria-hidden="true" />
              <Plus size={18} className="hidden sm:block" aria-hidden="true" />
            </Link>
          </div>

          {/* Quick category links */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {QUICK_LINKS.map(({ icon: Icon, label, href }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold text-white/85 transition-colors"
              >
                <Icon size={12} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </section>

    <ListingSearchBar
      categories={HOME_SEARCH_CATS}
      defaultCat="all"
      addListingHref="/add-listing"
    />
    </>
  );
}
