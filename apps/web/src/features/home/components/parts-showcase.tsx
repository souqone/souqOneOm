'use client';

import { useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion, useInView } from 'framer-motion';
import { CardGrid } from '@/features/listings/components/CardGrid';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import type { SparePartItem } from '@/lib/api/parts';

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

interface PartsShowcaseProps {
  items: SparePartItem[];
  isLoading: boolean;
}

export function PartsShowcase({ items, isLoading }: PartsShowcaseProps) {
  const t = useTranslations('home');
  const { transformPart } = useItemTransformers();

  return (
    <section className="bg-surface-container-low dark:bg-surface-dim py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <AnimatedSection>
          <motion.div variants={fadeUp} className="flex flex-wrap justify-between items-end gap-2 mb-4 sm:mb-6">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="h-6 sm:h-8 w-1 bg-primary" />
                <h2 className="text-base sm:text-xl md:text-3xl font-black">{t('latestParts')}</h2>
              </div>
              <p className="text-on-surface-variant text-xs sm:text-sm">{t('latestPartsDesc')}</p>
            </div>
            <Link href="/browse/parts" className="text-primary font-bold text-xs sm:text-sm hover:underline transition-colors">
              {t('viewAll')}
            </Link>
          </motion.div>

          <motion.div variants={fadeUp}>
            <CardGrid
              items={items}
              mapItem={transformPart}
              isLoading={isLoading}
              emptyIcon="settings"
              emptyMessage={t('noPartsNow')}
            />
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}
