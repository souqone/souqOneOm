'use client';

import { useParams } from 'next/navigation';
import { GenericEditForm } from '@/components/generic-edit-form';
import { usePart, useUpdatePart, useRemovePartImage } from '@/lib/api/parts';
import { useTranslations } from 'next-intl';

export function EditPartsForm() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = usePart(id);
  const update = useUpdatePart();
  const removePartImage = useRemovePartImage();
  const tp = useTranslations('pages');

  const fields = [
    { name: 'title', label: 'Title', required: true },
    { name: 'partCategory', label: 'Category', type: 'select' as const, options: [
      { value: 'ENGINE', label: 'Engine' },
      { value: 'TRANSMISSION', label: 'Transmission' },
      { value: 'BRAKES', label: 'Brakes' },
      { value: 'SUSPENSION', label: 'Suspension' },
      { value: 'ELECTRICAL', label: 'Electrical' },
      { value: 'BODY', label: 'Body' },
      { value: 'INTERIOR', label: 'Interior' },
      { value: 'TIRES_WHEELS', label: 'Tires & Wheels' },
      { value: 'OTHER', label: 'Other' },
    ]},
    { name: 'condition', label: 'Condition', type: 'select' as const, options: [
      { value: 'NEW', label: 'New' },
      { value: 'USED', label: 'Used' },
      { value: 'REFURBISHED', label: 'Refurbished' },
    ]},
    { name: 'compatibleMake', label: 'Compatible Make' },
    { name: 'compatibleModel', label: 'Compatible Model' },
    { name: 'price', label: 'Price', type: 'number' as const },
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
      redirectPath={`/sale/part/${id}`}
      uploadEndpoint={`/api/v1/uploads/parts/${id}/images`}
      deleteImageFn={(imageId) => removePartImage.mutateAsync(imageId)}
    />
  );
}
