'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const CAT_META = [
  { labelKey: 'catCars',      descKey: 'catCarsDesc',      image: '/images/categories/cars.webp',   href: '/browse/cars',   color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
  { labelKey: 'catBuses',     descKey: 'catBusesDesc',     image: '/images/categories/buses.webp',   href: '/browse/buses',      color: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400' },
  { labelKey: 'catParts',     descKey: 'catPartsDesc',     image: '/images/categories/parts.webp',         href: '/browse/parts',      color: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' },
  { labelKey: 'catServices',  descKey: 'catServicesDesc',  image: '/images/categories/services.webp',            href: '/browse/services',   color: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' },
  { labelKey: 'catEquipment', descKey: 'catEquipmentDesc', image: '/images/categories/equipment.webp',     href: '/browse/equipment',  color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
  { labelKey: 'catJobs',      descKey: 'catJobsDesc',      image: '/images/categories/jobs.webp',            href: '/jobs',       color: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' },
  { labelKey: 'catRentals',   descKey: 'catRentalsDesc',   image: '/images/categories/rentals.webp',       href: '/browse/cars?listingType=RENTAL',    color: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' },
] as const;

const SLIDE_INTERVAL = 3000;

export function CategoriesSection() {
  const t = useTranslations('home');
  const scrollerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const dirRef = useRef(1);

  useEffect(() => {
    const maxPos = CAT_META.length - 4;

    const timer = setInterval(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const item = scroller.children[0] as HTMLElement;
      if (!item) return;

      posRef.current += dirRef.current;
      if (posRef.current >= maxPos) { posRef.current = maxPos; dirRef.current = -1; }
      if (posRef.current <= 0) { posRef.current = 0; dirRef.current = 1; }

      const step = item.offsetWidth + 8;
      scroller.scrollTo({
        left: posRef.current * step,
        behavior: 'smooth',
      });
    }, SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-6 sm:pt-10 pb-2 sm:pb-3">
      <AnimatedSection>
        <motion.div variants={fadeUp} className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-8">
          <div className="h-6 sm:h-8 w-1 rounded-full bg-primary" />
          <h2 className="text-sm sm:text-xl md:text-3xl font-black tracking-tight whitespace-nowrap">{t('browseCategories')}</h2>
        </motion.div>

      {/* Mobile: sliding window carousel — always shows 4, shifts 1 at a time */}
      <div
        ref={scrollerRef}
        className="lg:hidden flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
          {CAT_META.map((cat) => (
            <Link
              key={cat.labelKey}
              href={cat.href}
              className="group relative overflow-hidden shrink-0 snap-start flex flex-col rounded-2xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 hover:border-primary/20 active:scale-[0.97] transition-all duration-300"
              style={{ width: 'calc((100% - 24px) / 4)' }}
            >
              <div className="w-full h-16 sm:h-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                <Image src={cat.image} alt={t(cat.labelKey)} width={200} height={150} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" sizes="25vw" loading="lazy" />
              </div>
              <div className="p-2 text-center relative z-20 bg-surface-container-lowest dark:bg-surface-container">
                <h3 className="font-bold text-[10px] sm:text-xs text-on-surface leading-tight mb-0.5">{t(cat.labelKey)}</h3>
                <p className="hidden sm:block text-[9px] text-on-surface-variant/60 leading-tight">{t(cat.descKey)}</p>
              </div>
            </Link>
          ))}
      </div>

      {/* Desktop: full-width grid */}
      <div className="hidden lg:grid grid-cols-7 gap-4">
        {CAT_META.map((cat) => (
          <Link
            key={cat.labelKey}
            href={cat.href}
            className="group relative overflow-hidden flex flex-col rounded-[20px] bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 hover:border-primary/20 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] active:scale-[0.97] transition-all duration-300"
          >
            <div className="w-full h-28 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-60 group-hover:opacity-20 transition-opacity duration-300 z-10" />
              <Image src={cat.image} alt={t(cat.labelKey)} width={400} height={300} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" sizes="14vw" loading="lazy" />
            </div>
            <div className="p-4 text-center relative z-20 bg-surface-container-lowest dark:bg-surface-container transition-colors duration-300 group-hover:bg-surface-container-low dark:group-hover:bg-surface-container-high">
              <h3 className="font-bold text-[15px] text-on-surface leading-tight mb-1.5">{t(cat.labelKey)}</h3>
              <p className="text-[11px] text-on-surface-variant/70 leading-relaxed line-clamp-2">{t(cat.descKey)}</p>
            </div>
          </Link>
        ))}
      </div>
      </AnimatedSection>
    </section>
  );
}
