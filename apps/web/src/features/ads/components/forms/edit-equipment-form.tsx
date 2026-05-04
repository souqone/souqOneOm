'use client';

import { useParams } from 'next/navigation';
import { EquipmentForm } from './EquipmentForm';
import { useEquipmentListing } from '@/lib/api/equipment';

export function EditEquipmentForm() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useEquipmentListing(id);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;
  if (!data) return null;

  return <EquipmentForm mode="edit" initialData={data} id={id} />;
}
