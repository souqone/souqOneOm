import type { Metadata } from 'next';
import { BusesLandingClient } from './buses-landing-client';
import { serverFetch } from '@/lib/server-fetch';
import type { BusListingItem } from '@/lib/api/buses';

interface Paginated<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const metadata: Metadata = {
  title: 'حافلات للبيع والإيجار — سوق وان',
  description: 'أكبر سوق حافلات في سلطنة عُمان. استأجر أو اشترِ حافلات سياحية، نقل موظفين، مدارس، VIP.',
};

export default async function BusesLandingPage() {
  const data = await serverFetch<Paginated<BusListingItem>>(
    '/buses?page=1&limit=50',
    { revalidate: 120, tags: ['buses'] }
  ).catch(() => null);

  return <BusesLandingClient buses={data?.items ?? []} totalBuses={data?.meta.total ?? 0} />;
}
