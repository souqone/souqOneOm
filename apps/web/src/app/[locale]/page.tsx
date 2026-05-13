import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { WelcomeModal } from '@/components/welcome-modal';
import { serverFetch } from '@/lib/server-fetch';
import type { ListingsResponse } from '@/lib/api/listings';
import type { BusListingItem } from '@/lib/api/buses';
import type { SparePartItem } from '@/lib/api/parts';
import type { EquipmentListingItem } from '@/lib/api/equipment';
import type { JobsResponse } from '@/lib/api/jobs';
import type { CarServiceItem } from '@/lib/api/services';
import {
  CategoriesSection,
  FeaturedShowroom,
  QuickServicesGrid,
  NewsletterCta,
} from '@/features/home';
import { LazyBuses, LazyParts, LazyEquipment, LazyServices, LazyJobs } from '@/features/home/lazy';

interface Paginated<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

async function getHomeData() {
  const [featured, buses, parts, equipment, services, jobs] = await Promise.all([
    serverFetch<ListingsResponse>('/listings?page=1&limit=4', { revalidate: 60, tags: ['listings'] }).catch((e) => { console.error('Listings error:', e); return null; }),
    serverFetch<Paginated<BusListingItem>>('/buses?page=1&limit=4', { revalidate: 60, tags: ['buses'] }).catch((e) => { console.error('Buses error:', e); return null; }),
    serverFetch<Paginated<SparePartItem>>('/parts?page=1&limit=4', { revalidate: 60, tags: ['parts'] }).catch((e) => { console.error('Parts error:', e); return null; }),
    serverFetch<Paginated<EquipmentListingItem>>('/equipment?page=1&limit=4', { revalidate: 60, tags: ['equipment'] }).catch((e) => { console.error('Equipment error:', e); return null; }),
    serverFetch<Paginated<CarServiceItem>>('/services?page=1&limit=4', { revalidate: 60, tags: ['services'] }).catch((e) => { console.error('Services error:', e); return null; }),
    serverFetch<JobsResponse>('/jobs?limit=6', { revalidate: 60, tags: ['jobs'] }).catch((e) => { console.error('Jobs error:', e); return null; }),
  ]);
  return { featured, buses, parts, equipment, services, jobs };
}

export default async function Home() {
  const { featured, buses, parts, equipment, services, jobs } = await getHomeData();

  return (
    <>
      <Navbar />
      <WelcomeModal />

      <main>
        {/* 1. Browse categories */}
        <CategoriesSection />

        {/* 3. Quick services */}
        <QuickServicesGrid />

        {/* 4. Featured cars (sale + rental) — above fold, render immediately */}
        <FeaturedShowroom
          items={featured?.items ?? []}
          isLoading={false}
        />

        {/* 5. Latest buses — lazy loaded */}
        <LazyBuses items={buses?.items ?? []} />

        {/* 6. Latest spare parts — lazy loaded */}
        <LazyParts items={parts?.items ?? []} />

        {/* 7. Latest equipment — lazy loaded */}
        <LazyEquipment items={equipment?.items ?? []} />

        {/* 8. Car services — lazy loaded */}
        <LazyServices items={services?.items ?? []} />

        {/* 9. Driver jobs — lazy loaded */}
        <LazyJobs items={jobs?.items ?? []} />

        {/* 9. Newsletter CTA */}
        <NewsletterCta />
      </main>

      <Footer />
    </>
  );
}
