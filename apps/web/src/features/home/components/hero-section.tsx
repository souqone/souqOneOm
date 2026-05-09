'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { LayoutGrid, ChevronDown, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcn/popover';
import { getGovernorates, type LocationOption } from '@/lib/location-data';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const HERO_SLIDES = ['/hero.webp', '/hero-banner-2.webp'];
const SLIDE_INTERVAL = 5000;


const OMAN_GOVS = getGovernorates('OM');

const HERO_CATS = [
  { value: 'all',       label: 'كل الأقسام', route: '/browse' },
  { value: 'cars',      label: 'سيارات',     route: '/browse/cars' },
  { value: 'buses',     label: 'حافلات',     route: '/browse/buses' },
  { value: 'equipment', label: 'معدات',      route: '/browse/equipment' },
  { value: 'parts',     label: 'قطع غيار',  route: '/browse/parts' },
  { value: 'services',  label: 'خدمات',        route: '/browse/services' },
  { value: 'transport', label: 'طلبات النقل',  route: '/transport/browse' },
  { value: 'jobs',      label: 'وظائف',        route: '/jobs' },
] as const;

type HeroCat = typeof HERO_CATS[number];

const FLOAT_CATS = [
  { icon: 'directions_car',   label: 'سيارات',          sub: 'بيع وشراء وتأجير',       href: '/browse/cars' },
  { icon: 'directions_bus',   label: 'حافلات',           sub: 'بيع وتأجير وعقود',       href: '/browse/buses' },
  { icon: 'construction',     label: 'معدات ثقيلة',      sub: 'بيع وتأجير وطلبات',      href: '/browse/equipment' },
  { icon: 'settings',         label: 'قطع غيار',         sub: 'جميع الأنواع',           href: '/browse/parts' },
  { icon: 'build',            label: 'خدمات سيارات',     sub: 'صيانة وتعديل وغيرها',   href: '/browse/services' },
  { icon: 'badge',            label: 'وظائف السائقين',   sub: 'فرص عمل مميزة',          href: '/jobs' },
] as const;

export function HeroSection() {
  const router = useRouter();
  const t = useTranslations('home');
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedGov, setSelectedGov] = useState<{ value: string; label: string } | null>(null);
  const [selectedCat, setSelectedCat] = useState<HeroCat>(HERO_CATS[0]);

  const nextSlide = useCallback(() => {
    setActiveSlide(prev => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveSlide(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 640) inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [nextSlide]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (selectedGov) params.set('governorate', selectedGov.value);
    const qs = params.toString();
    router.push(`${selectedCat.route}${qs ? `?${qs}` : ''}`);
  }

  return (
    <section>
      {/* ── Hero Banner Slider ── */}
      <div className="pb-3">
        {/* Outer wrapper — allows dropdowns to escape overflow-hidden */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[16/5] lg:aspect-[16/5.5] xl:aspect-[16/5]">
          {/* Image + gradient layer — overflow-hidden only here */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-none">
            {HERO_SLIDES.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt="سوق وان"
                fill
                priority={i === 0}
                className={`object-cover transition-opacity duration-700 ${i === activeSlide ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1e52] via-[#102a6e]/60 to-transparent" />
          </div>

          {/* Prev / Next arrows */}
          <button
            type="button"
            onClick={prevSlide}
            className="absolute start-3 sm:start-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/25 hover:bg-black/45 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
            aria-label="السابق"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="absolute end-3 sm:end-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/25 hover:bg-black/45 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
            aria-label="التالي"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
          </button>

          {/* Dot indicators */}
          <div className="absolute top-2.5 sm:top-4 lg:top-5 inset-x-0 flex justify-center gap-1.5 sm:gap-2 z-10">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveSlide(i)}
                className={`h-2 sm:h-2.5 rounded-full transition-all ${i === activeSlide ? 'bg-white w-5 sm:w-7' : 'bg-white/50 w-2 sm:w-2.5'}`}
              />
            ))}
          </div>

          {/* Content overlay — outside overflow-hidden so dropdowns work */}
          <div className="absolute inset-x-0 px-4 sm:px-8 lg:px-12 xl:px-16 pb-3 sm:pb-6 lg:pb-10 xl:pb-12 text-white flex flex-col items-center text-center z-20" style={{ bottom: '45px' }}>
            <h1 className="text-base sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black leading-tight mb-1 sm:mb-1 lg:mb-2">
              <span className="text-white">منصة </span>
              <span className="bg-gradient-to-l from-[#e54d00] via-[#fe5e00] to-[#ff9a5c] bg-clip-text text-transparent">عمان الأولى</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/80 leading-snug mb-2 sm:mb-3 lg:mb-4 max-w-lg lg:max-w-xl">
              {t('heroSubtitle')}
            </p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mb-3 sm:mb-4 lg:mb-5 w-full max-w-[696px] lg:max-w-[792px]"
            >
              <form
                onSubmit={handleSearch}
                className="flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full border border-white/25 ps-4 sm:ps-5 pe-2 py-1.5 shadow-sm"
              >
                {/* Input — rightmost */}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t('heroSearchPlaceholder')}
                  dir="rtl"
                  className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder:text-white/50 focus:outline-none min-w-0 text-right"
                />

                {/* Separator */}
                <span className="w-px h-5 bg-white/20 shrink-0 mx-0.5" />

                {/* Category pill */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 h-8 sm:h-9 text-xs sm:text-sm font-bold text-white bg-white/20 rounded-full px-3 sm:px-4 hover:bg-white/30 transition-colors whitespace-nowrap shrink-0"
                    >
                      <LayoutGrid className="w-4 h-4 shrink-0 text-white" strokeWidth={2.5} />
                      <span>{selectedCat.label}</span>
                      <ChevronDown className="w-3.5 h-3.5 shrink-0 text-white/70" strokeWidth={2.5} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={8}
                    className="w-44 max-h-56 overflow-y-auto no-scrollbar rounded-xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container shadow-lg p-1"
                  >
                    {HERO_CATS.map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setSelectedCat(cat)}
                        className={`w-full text-start px-3 py-2 text-xs sm:text-sm hover:bg-surface-container-low rounded-lg transition-colors ${
                          selectedCat.value === cat.value
                            ? 'text-primary font-bold bg-primary/5'
                            : 'text-on-surface'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                {/* Location pill */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 h-8 sm:h-9 text-xs sm:text-sm font-bold text-white bg-white/20 rounded-full px-3 sm:px-4 hover:bg-white/30 transition-colors whitespace-nowrap shrink-0"
                    >
                      <MapPin className="w-4 h-4 shrink-0 text-white" strokeWidth={2.5} />
                      <span>{selectedGov ? selectedGov.label : t('heroLocation')}</span>
                      <ChevronDown className="w-3.5 h-3.5 shrink-0 text-white/70" strokeWidth={2.5} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={8}
                    className="w-44 max-h-56 overflow-y-auto no-scrollbar rounded-xl border border-outline-variant/20 bg-surface-container-lowest dark:bg-surface-container shadow-lg p-1"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedGov(null)}
                      className={`w-full text-start px-3 py-2 text-xs sm:text-sm hover:bg-surface-container-low rounded-lg transition-colors ${!selectedGov ? 'text-primary font-bold bg-primary/5' : 'text-on-surface'}`}
                    >
                      {t('heroLocationAll')}
                    </button>
                    {OMAN_GOVS.map((gov: LocationOption) => (
                      <button
                        key={gov.value}
                        type="button"
                        onClick={() => setSelectedGov(gov)}
                        className={`w-full text-start px-3 py-2 text-xs sm:text-sm hover:bg-surface-container-low rounded-lg transition-colors ${selectedGov?.value === gov.value ? 'text-primary font-bold bg-primary/5' : 'text-on-surface'}`}
                      >
                        {gov.label}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>

                {/* Search button — leftmost */}
                <button
                  type="submit"
                  className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-primary rounded-full flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-on-primary text-[16px] sm:text-[18px]">search</span>
                </button>
              </form>
            </motion.div>

          </div>
        </div>
      </div>

      {/* ── Floating Category Bar ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 relative z-30 -mt-10 sm:-mt-12 lg:-mt-[70px]" style={{ paddingInline: '120px' }}>
        <div className="bg-white dark:bg-surface-container rounded-2xl sm:rounded-3xl shadow-xl border border-outline-variant/10 overflow-hidden">
          <div className="grid grid-cols-3 sm:grid-cols-6">
            {FLOAT_CATS.map((cat, i) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`group flex flex-col items-center justify-center gap-1 sm:gap-1 py-2 sm:py-2.5 px-1 text-center hover:bg-primary/5 transition-colors ${
                  i < 5 ? 'border-e border-outline-variant/10' : ''
                } ${
                  i >= 3 ? 'border-t sm:border-t-0 border-outline-variant/10' : ''
                }`}
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-primary/8 dark:bg-primary/15 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <span className="material-symbols-outlined text-primary text-[20px] sm:text-[24px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}>{cat.icon}</span>
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs font-black text-on-surface leading-tight">{cat.label}</p>
                  <p className="text-[9px] sm:text-[10px] text-on-surface-variant/60 leading-tight mt-0.5">{cat.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
