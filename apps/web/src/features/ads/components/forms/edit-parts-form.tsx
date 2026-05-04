'use client';

import { useParams } from 'next/navigation';
import { PartForm } from './PartForm';
import { usePart } from '@/lib/api/parts';

export function EditPartsForm() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = usePart(id);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;
  if (!data) return null;

  return <PartForm mode="edit" initialData={data} id={id} />;
}
