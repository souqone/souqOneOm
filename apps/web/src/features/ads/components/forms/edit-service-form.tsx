'use client';

import { useParams } from 'next/navigation';
import { ServiceForm } from './ServiceForm';
import { useCarService } from '@/lib/api/services';

export function EditServiceForm() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useCarService(id);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;
  if (!data) return null;

  return <ServiceForm mode="edit" initialData={data} id={id} />;
}
