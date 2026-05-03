'use client';

import { useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import { CardSlider } from '@/features/listings/components/CardSlider';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import type { CarServiceItem } from '@/lib/api/services';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

interface ServicesShowcaseProps {
  items: CarServiceItem[];
  isLoading: boolean;
}

export function ServicesShowcase({ items, isLoading }: ServicesShowcaseProps) {
  const t = useTranslations('home');
  const { transformService } = useItemTransformers();

  return (
    <section className="py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <AnimatedSection>
          <motion.div variants={fadeUp} className="flex flex-wrap justify-between items-end gap-2 mb-4 sm:mb-6">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="h-6 sm:h-8 w-1 bg-primary" />
                <h2 className="text-base sm:text-xl md:text-3xl font-black">{t('latestServices')}</h2>
              </div>
              <p className="text-on-surface-variant text-xs sm:text-sm">{t('latestServicesDesc')}</p>
            </div>
            <Link href="/browse/services" className="text-primary font-bold text-xs sm:text-sm hover:underline transition-colors">
              {t('viewAll')}
            </Link>
          </motion.div>

          <motion.div variants={fadeUp}>
            <CardSlider
              items={items.slice(0, 8)}
              mapItem={transformService}
              isLoading={isLoading}
              emptyIcon="build"
              emptyMessage={t('noServicesNow')}
            />
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}
