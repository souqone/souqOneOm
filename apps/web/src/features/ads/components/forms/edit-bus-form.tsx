'use client';

import { useParams } from 'next/navigation';
import { GenericEditForm } from '@/components/generic-edit-form';
import { useBusListing, useUpdateBusListing, useRemoveBusImage } from '@/lib/api/buses';
import { useTranslations } from 'next-intl';

export function EditBusForm() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useBusListing(id);
  const update = useUpdateBusListing();
  const removeBusImage = useRemoveBusImage();
  const tp = useTranslations('pages');

  const fields = [
    { name: 'title', label: tp('editListingTitle'), required: true },
    { name: 'busType', label: tp('sectionBuses') + ' - Type', type: 'select' as const, options: [
      { value: 'MINI_BUS', label: 'Mini Bus' },
      { value: 'MEDIUM_BUS', label: 'Medium Bus' },
      { value: 'LARGE_BUS', label: 'Large Bus' },
      { value: 'COASTER', label: 'Coaster' },
      { value: 'SCHOOL_BUS', label: 'School Bus' },
    ]},
    { name: 'make', label: 'Make' },
    { name: 'model', label: 'Model' },
    { name: 'year', label: 'Year', type: 'number' as const },
    { name: 'price', label: 'Price', type: 'number' as const },
    { name: 'passengerCapacity', label: 'Passenger Capacity', type: 'number' as const },
    { name: 'governorate', label: 'Governorate' },
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
      redirectPath={`/sale/bus/${id}`}
      uploadEndpoint={`/uploads/buses/${id}/images`}
      deleteImageFn={(imageId) => removeBusImage.mutateAsync(imageId)}
    />
  );
}
