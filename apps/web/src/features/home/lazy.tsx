'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { CardSkeleton } from '@/components/loading-skeleton';
import type { BusListingItem } from '@/lib/api/buses';
import type { SparePartItem } from '@/lib/api/parts';
import type { EquipmentListingItem } from '@/lib/api/equipment';
import type { JobItem } from '@/lib/api/jobs';
import type { CarServiceItem } from '@/lib/api/services';

// ── Intersection Observer wrapper ──
function LazySection({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{visible ? children : fallback}</div>;
}

// ── Skeleton placeholder for a showcase section ──
function ShowcaseSkeleton() {
  return (
    <div className="py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}

// ── Dynamic imports ──
const BusesShowcase = dynamic(
  () => import('./components/buses-showcase').then(m => ({ default: m.BusesShowcase })),
  { loading: () => <ShowcaseSkeleton /> },
);

const PartsShowcase = dynamic(
  () => import('./components/parts-showcase').then(m => ({ default: m.PartsShowcase })),
  { loading: () => <ShowcaseSkeleton /> },
);

const EquipmentShowcase = dynamic(
  () => import('./components/equipment-showcase').then(m => ({ default: m.EquipmentShowcase })),
  { loading: () => <ShowcaseSkeleton /> },
);

const ServicesShowcase = dynamic(
  () => import('./components/services-showcase').then(m => ({ default: m.ServicesShowcase })),
  { loading: () => <ShowcaseSkeleton /> },
);

const JobsSection = dynamic(
  () => import('./components/jobs-section').then(m => ({ default: m.JobsSection })),
  { loading: () => <ShowcaseSkeleton /> },
);

// ── Lazy wrappers that combine IntersectionObserver + dynamic import ──
export function LazyBuses({ items }: { items: BusListingItem[] }) {
  return (
    <LazySection fallback={<ShowcaseSkeleton />}>
      <BusesShowcase items={items} isLoading={false} />
    </LazySection>
  );
}

export function LazyParts({ items }: { items: SparePartItem[] }) {
  return (
    <LazySection fallback={<ShowcaseSkeleton />}>
      <PartsShowcase items={items} isLoading={false} />
    </LazySection>
  );
}

export function LazyEquipment({ items }: { items: EquipmentListingItem[] }) {
  return (
    <LazySection fallback={<ShowcaseSkeleton />}>
      <EquipmentShowcase items={items} isLoading={false} />
    </LazySection>
  );
}

export function LazyServices({ items }: { items: CarServiceItem[] }) {
  return (
    <LazySection fallback={<ShowcaseSkeleton />}>
      <ServicesShowcase items={items} isLoading={false} />
    </LazySection>
  );
}

export function LazyJobs({ items }: { items: JobItem[] }) {
  return (
    <LazySection fallback={<ShowcaseSkeleton />}>
      <JobsSection items={items} isLoading={false} />
    </LazySection>
  );
}
