'use client';

import { useParams } from 'next/navigation';
import { GenericEditForm } from '@/components/generic-edit-form';
import { useCarService, useUpdateCarService, useRemoveServiceImage } from '@/lib/api/services';
import { useTranslations } from 'next-intl';

export function EditServiceForm() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useCarService(id);
  const update = useUpdateCarService();
  const removeServiceImage = useRemoveServiceImage();
  const tp = useTranslations('pages');

  const fields = [
    { name: 'title', label: 'Title', required: true },
    { name: 'serviceType', label: 'Service Type', type: 'select' as const, options: [
      { value: 'MAINTENANCE', label: 'Maintenance' },
      { value: 'REPAIR', label: 'Repair' },
      { value: 'DETAILING', label: 'Detailing' },
      { value: 'TINTING', label: 'Tinting' },
      { value: 'ACCESSORIES', label: 'Accessories' },
      { value: 'INSPECTION', label: 'Inspection' },
      { value: 'INSURANCE_SERVICE', label: 'Insurance Service' },
      { value: 'OTHER', label: 'Other' },
    ]},
    { name: 'price', label: 'Price', type: 'number' as const },
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
      redirectPath={`/sale/service/${id}`}
      uploadEndpoint={`/api/v1/uploads/services/${id}/images`}
      deleteImageFn={(imageId) => removeServiceImage.mutateAsync(imageId)}
    />
  );
}
