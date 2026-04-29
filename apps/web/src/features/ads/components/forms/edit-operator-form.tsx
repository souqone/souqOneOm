'use client';

import { useParams } from 'next/navigation';
import { GenericEditForm } from '@/components/generic-edit-form';
import { useOperatorListing, useUpdateOperatorListing } from '@/lib/api/equipment';
import { useTranslations } from 'next-intl';

export function EditOperatorForm() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useOperatorListing(id);
  const update = useUpdateOperatorListing();
  const tp = useTranslations('pages');

  const fields = [
    { name: 'title', label: 'Title', required: true },
    { name: 'operatorType', label: 'Operator Type', type: 'select' as const, options: [
      { value: 'DRIVER', label: 'Driver' },
      { value: 'OPERATOR', label: 'Operator' },
      { value: 'TECHNICIAN', label: 'Technician' },
    ]},
    { name: 'experienceYears', label: 'Experience (Years)', type: 'number' as const },
    { name: 'dailyRate', label: 'Daily Rate', type: 'number' as const },
    { name: 'governorate', label: 'Governorate' },
    { name: 'phone', label: 'Phone' },
    { name: 'description', label: 'Description', type: 'textarea' as const },
  ];

  return (
    <GenericEditForm
      title={tp('editListingTitle')}
      subtitle={tp('editListingDesc')}
      item={data as Record<string, any>}
      isLoading={isLoading}
      isError={isError}
      refetch={refetch}
      fields={fields}
      updateFn={(payload) => update.mutateAsync({ id, data: payload })}
      isUpdating={update.isPending}
      redirectPath={`/equipment/operators/${id}`}
    />
  );
}
