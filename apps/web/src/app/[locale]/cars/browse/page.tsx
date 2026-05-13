import type { Metadata } from 'next';
import { CATEGORY_META } from '@/features/listings/types/category.types';
import { ListingsPageShell } from '@/features/listings/components/ListingsPageShell';
import SubNavBar from '@/components/layout/SubNavBar';

export const metadata: Metadata = {
  title: `${CATEGORY_META.cars.labelAr} — سوق وان`,
  description: `تصفح إعلانات ${CATEGORY_META.cars.labelAr} في عُمان`,
};

export default function CarsBrowsePage() {
  return (
    <>
      <SubNavBar />
      <ListingsPageShell category="cars" />
    </>
  );
}
