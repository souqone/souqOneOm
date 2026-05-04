'use client';

import { useParams } from 'next/navigation';
import { OperatorForm } from './OperatorForm';
import { useOperatorListing } from '@/lib/api/equipment';

export function EditOperatorForm() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useOperatorListing(id);

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;
  if (!data) return null;

  return <OperatorForm mode="edit" initialData={data} id={id} />;
}
