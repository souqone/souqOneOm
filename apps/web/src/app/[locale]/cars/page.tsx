import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { serverFetch } from '@/lib/server-fetch';
import type { ListingsResponse } from '@/lib/api/listings';
import type { SparePartItem } from '@/lib/api/parts';
import type { Metadata } from 'next';
import { CarsShell } from './cars-shell';
import SubNavBar from '@/components/layout/SubNavBar';

interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  serviceType: string;
  providerType: string;
  providerName: string;
  priceFrom?: string;
  priceTo?: string;
  currency: string;
  isHomeService: boolean;
  governorate: string;
  city?: string;
  viewCount: number;
  images: { id: string; url: string; isPrimary: boolean; order: number }[];
  createdAt: string;
  user: { id: string; username: string; displayName?: string; avatarUrl?: string; isVerified?: boolean };
}

interface PaginatedServices {
  items: ServiceItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface PaginatedParts {
  items: SparePartItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const metadata: Metadata = {
  title: 'السيارات وخدماتها | سوق ون',
  description: 'تصفح السيارات للبيع والإيجار وخدمات السيارات في عُمان — صيانة، تنظيف، تعديل، فحص، سمكرة وأكثر.',
};

async function getCarsData() {
  const [saleCars, rentalCars, services, parts] = await Promise.all([
    serverFetch<ListingsResponse>('/listings?page=1&limit=8&listingType=SALE', { revalidate: 60, tags: ['listings'] }).catch(() => null),
    serverFetch<ListingsResponse>('/listings?page=1&limit=4&listingType=RENTAL', { revalidate: 60, tags: ['listings'] }).catch(() => null),
    serverFetch<PaginatedServices>('/services?page=1&limit=6', { revalidate: 60, tags: ['services'] }).catch(() => null),
    serverFetch<PaginatedParts>('/parts?page=1&limit=8', { revalidate: 60, tags: ['parts'] }).catch(() => null),
  ]);
  return { saleCars, rentalCars, services, parts };
}

export default async function CarsPage() {
  const { saleCars, rentalCars, services, parts } = await getCarsData();

  return (
    <>
      <Navbar />
      <SubNavBar />
      <CarsShell
        saleCars={saleCars?.items ?? []}
        rentalCars={rentalCars?.items ?? []}
        services={services?.items ?? []}
        parts={parts?.items ?? []}
      />
      <Footer />
    </>
  );
}
