import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { serverFetch } from '@/lib/server-fetch';
import type { EquipmentListingItem, EquipmentRequestItem, OperatorListingItem } from '@/lib/api/equipment';
import type { Metadata } from 'next';
import { EquipmentShell } from './equipment-shell';

interface PaginatedEquipment {
  items: EquipmentListingItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface PaginatedRequests {
  items: EquipmentRequestItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface PaginatedOperators {
  items: OperatorListingItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const metadata: Metadata = {
  title: 'المعدات الثقيلة | سوق ون',
  description: 'تصفح المعدات الثقيلة للبيع والإيجار في عُمان — حفارات، رافعات، لودرات، مولدات، شاحنات وأكثر.',
};

async function getEquipmentData() {
  const [saleEquipment, rentalEquipment, operators, requests] = await Promise.all([
    serverFetch<PaginatedEquipment>('/equipment?page=1&limit=8&listingType=EQUIPMENT_SALE', { revalidate: 60, tags: ['equipment'] }).catch(() => null),
    serverFetch<PaginatedEquipment>('/equipment?page=1&limit=4&listingType=EQUIPMENT_RENT', { revalidate: 60, tags: ['equipment'] }).catch(() => null),
    serverFetch<PaginatedOperators>('/operators?page=1&limit=6', { revalidate: 60, tags: ['operators'] }).catch(() => null),
    serverFetch<PaginatedRequests>('/equipment-requests?page=1&limit=6&requestStatus=OPEN', { revalidate: 60, tags: ['equipment-requests'] }).catch(() => null),
  ]);
  return { saleEquipment, rentalEquipment, operators, requests };
}

export default async function EquipmentPage() {
  const { saleEquipment, rentalEquipment, operators, requests } = await getEquipmentData();

  return (
    <>
      <Navbar />
      <EquipmentShell
        saleEquipment={saleEquipment?.items ?? []}
        rentalEquipment={rentalEquipment?.items ?? []}
        operators={operators?.items ?? []}
        requests={requests?.items ?? []}
      />
      <Footer />
    </>
  );
}
