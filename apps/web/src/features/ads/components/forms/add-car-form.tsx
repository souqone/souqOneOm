'use client';

import { useSearchParams } from 'next/navigation';
import { CarFormShell } from './car/CarFormShell';

function AddCarFormInner() {
  const searchParams = useSearchParams();
  const listingType = (searchParams.get('type') as 'SALE' | 'RENTAL') || 'SALE';
  return <CarFormShell mode="add" initialData={{ listingType }} />;
}

export function AddCarForm() {
  return <AddCarFormInner />;
}
