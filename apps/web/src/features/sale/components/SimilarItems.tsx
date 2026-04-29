/**
 * Similar items section with slider arrows (desktop) and swipe (mobile).
 * Shows related listings from the same category.
 */

'use client';

import { memo, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useListings } from '@/lib/api/listings';
import { useBusListings } from '@/lib/api/buses';
import { useEquipmentListings } from '@/lib/api/equipment';
import { useParts } from '@/lib/api/parts';
import { useCarServices } from '@/lib/api/services';
import { useTranslations } from 'next-intl';
import type { SaleEntityType } from '../types/unified.types';
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import type { ListingCategory } from '@/features/listings/types/category.types';

interface SimilarItemsProps {
  type: SaleEntityType;
  currentId: string;
  governorate: string;
}

/**
 * Fetch similar items from the same category. Prioritise same governorate.
 */
function useSimilarListings(type: SaleEntityType, governorate: string, currentId: string) {
  const limit = '12';

  const carQuery = useListings(type === 'car' ? { limit } : {}, type === 'car');
  const busQuery = useBusListings(type === 'bus' ? { limit } : {}, type === 'bus');
  const equipmentQuery = useEquipmentListings(type === 'equipment' ? { limit } : {}, type === 'equipment');
  const partQuery = useParts(type === 'part' ? { limit } : {}, type === 'part');
  const serviceQuery = useCarServices(type === 'service' ? { limit } : {}, type === 'service');

  const query = {
    car: carQuery, bus: busQuery, equipment: equipmentQuery, part: partQuery, service: serviceQuery,
  }[type];

  const all = query.data?.items?.filter((item) => item.id !== currentId) || [];
  const sameGov = all.filter(i => i.governorate === governorate);
  const otherGov = all.filter(i => i.governorate !== governorate);
  const items = [...sameGov, ...otherGov].slice(0, 8);

  return { items, isLoading: query.isLoading };
}

const ENTITY_TO_CATEGORY: Record<SaleEntityType, ListingCategory> = {
  car: 'cars', bus: 'buses', equipment: 'equipment', part: 'parts', service: 'services',
};

export const SimilarItems = memo(function SimilarItems({
  type,
  currentId,
  governorate,
}: SimilarItemsProps) {
  const { items, isLoading } = useSimilarListings(type, governorate, currentId);
  const ts = useTranslations('sale');
  const { transformByCategory } = useItemTransformers();
  const category = ENTITY_TO_CATEGORY[type];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sl = Math.abs(el.scrollLeft);
    setCanScrollLeft(sl > 4);
    setCanScrollRight(sl + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
      <div className="mt-10 pt-6 border-t border-outline-variant/30">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-on-surface">{ts('similarTitle')}</h2>
        </div>
        <div className="flex gap-3 overflow-hidden -mx-4 px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] flex-shrink-0 h-48 bg-surface-container rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-10 pt-6 border-t border-outline-variant/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-on-surface">{ts('similarTitle')}</h2>
        <div className="flex items-center gap-2">
          {/* Arrows — desktop only */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
              aria-label="Previous"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
              aria-label="Next"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
          <a
            href={`/browse/${ENTITY_TO_CATEGORY[type]}`}
            className="text-[12px] font-medium text-primary hover:underline underline-offset-2"
          >
            {ts('viewAll')}
          </a>
        </div>
      </div>

      {/* Slider row: 2 mobile / 3 tablet / 4 desktop */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2"
      >
        {items.map((item) => (
          <div key={item.id} className="w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] flex-shrink-0 snap-start">
            <UnifiedCard item={transformByCategory(category, item)} className="h-full" />
          </div>
        ))}
      </div>
    </div>
  );
});
