'use client';

import { useParams } from 'next/navigation';
import { BusForm } from './BusForm';
import { useBusListing } from '@/lib/api/buses';

export function EditBusForm() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useBusListing(id);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;
  if (!data) return null;

  return <BusForm mode="edit" initialData={data} id={id} />;
}
