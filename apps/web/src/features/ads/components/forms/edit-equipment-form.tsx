'use client';

import { useParams } from 'next/navigation';
import { GenericEditForm } from '@/components/generic-edit-form';
import { useEquipmentListing, useUpdateEquipmentListing, useRemoveEquipmentImage } from '@/lib/api/equipment';
import { useTranslations } from 'next-intl';

export function EditEquipmentForm() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useEquipmentListing(id);
  const update = useUpdateEquipmentListing();
  const removeEquipImage = useRemoveEquipmentImage();
  const tp = useTranslations('pages');

  const fields = [
    { name: 'title', label: 'Title', required: true },
    { name: 'equipmentType', label: 'Equipment Type', type: 'select' as const, options: [
      { value: 'EXCAVATOR', label: 'Excavator' },
      { value: 'LOADER', label: 'Loader' },
      { value: 'BULLDOZER', label: 'Bulldozer' },
      { value: 'CRANE', label: 'Crane' },
      { value: 'FORKLIFT', label: 'Forklift' },
      { value: 'GENERATOR', label: 'Generator' },
      { value: 'COMPRESSOR', label: 'Compressor' },
      { value: 'CONCRETE_MIXER', label: 'Concrete Mixer' },
      { value: 'DUMP_TRUCK', label: 'Dump Truck' },
      { value: 'OTHER', label: 'Other' },
    ]},
    { name: 'make', label: 'Make' },
    { name: 'model', label: 'Model' },
    { name: 'year', label: 'Year', type: 'number' as const },
    { name: 'price', label: 'Price', type: 'number' as const },
    { name: 'condition', label: 'Condition', type: 'select' as const, options: [
      { value: 'NEW', label: 'New' },
      { value: 'USED', label: 'Used' },
      { value: 'REFURBISHED', label: 'Refurbished' },
    ]},
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
      redirectPath={`/sale/equipment/${id}`}
      uploadEndpoint={`/api/v1/uploads/equipment/${id}/images`}
      deleteImageFn={(imageId) => removeEquipImage.mutateAsync(imageId)}
    />
  );
}
