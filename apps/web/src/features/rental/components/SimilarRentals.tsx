'use client';

import { memo, useRef, useState, useCallback } from 'react';
import { useListings } from '@/lib/api/listings';
import { useBusListings } from '@/lib/api/buses';
import { useEquipmentListings } from '@/lib/api/equipment';
import { useTranslations } from 'next-intl';
import type { RentalEntityType } from '../types/unified-rental.types';
import { UnifiedCard } from '@/features/listings/components/UnifiedCard';
import { useItemTransformers } from '@/features/listings/hooks/useItemTransformers';
import type { ListingCategory } from '@/features/listings/types/category.types';
import { CardSkeleton } from '@/components/loading-skeleton';

interface SimilarRentalsProps {
  type: RentalEntityType;
  currentId: string;
  governorate: string;
}

const LISTING_TYPE_PARAM: Record<RentalEntityType, Record<string, string>> = {
  car: { listingType: 'RENTAL' },
  bus: { type: 'BUS_RENT' },
  equipment: { listingType: 'EQUIPMENT_RENT' },
};

function useSimilarRentals(type: RentalEntityType, governorate: string, currentId: string) {
  const limit = '12';
  const params = { limit, ...LISTING_TYPE_PARAM[type] };

  const carQuery = useListings(type === 'car' ? params : {}, type === 'car');
  const busQuery = useBusListings(type === 'bus' ? params : {}, type === 'bus');
  const equipmentQuery = useEquipmentListings(type === 'equipment' ? params : {});

  const query = { car: carQuery, bus: busQuery, equipment: equipmentQuery }[type];
  const all = query.data?.items?.filter((item) => item.id !== currentId) || [];
  const sameGov = all.filter(i => i.governorate === governorate);
  const otherGov = all.filter(i => i.governorate !== governorate);
  const items = [...sameGov, ...otherGov].slice(0, 8);

  return { items, isLoading: query.isLoading };
}

const RENTAL_TO_CATEGORY: Record<RentalEntityType, ListingCategory> = {
  car: 'cars', bus: 'buses', equipment: 'equipment',
};

export const SimilarRentals = memo(function SimilarRentals({
  type,
  currentId,
  governorate,
}: SimilarRentalsProps) {
  const { items, isLoading } = useSimilarRentals(type, governorate, currentId);
  const tr = useTranslations('rental');
  const { transformByCategory } = useItemTransformers();
  const category = RENTAL_TO_CATEGORY[type];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // RTL: scrollLeft is negative in RTL
    const sl = Math.abs(el.scrollLeft);
    setCanScrollLeft(sl > 4);
    setCanScrollRight(sl + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    // In RTL, "right" visually means negative scrollLeft
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
      <div className="mt-10 pt-6 border-t border-outline-variant/30">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-on-surface">{tr('similarTitle')}</h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] flex-shrink-0"><CardSkeleton /></div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  const listPaths: Record<RentalEntityType, string> = {
    car: '/listings?listingType=RENTAL',
    bus: '/buses?type=BUS_RENT',
    equipment: '/equipment?type=EQUIPMENT_RENT',
  };

  return (
    <div className="mt-10 pt-6 border-t border-outline-variant/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-on-surface">{tr('similarTitle')}</h2>
        <div className="flex items-center gap-2">
          {/* Arrows — desktop only */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
              aria-label={tr('prevArrow')}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
              aria-label={tr('nextArrow')}
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
          </div>
          <a
            href={`${listPaths[type]}&governorate=${governorate}`}
            className="text-[12px] font-medium text-primary hover:underline underline-offset-2"
          >
            {tr('viewAll')}
          </a>
        </div>
      </div>

      {/* Swiper row */}
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
