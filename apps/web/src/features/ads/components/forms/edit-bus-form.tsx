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
    { name: 'busType', label: 'نوع الباص', type: 'select' as const, options: [
      { value: 'MINI_BUS', label: 'ميني باص' },
      { value: 'MEDIUM_BUS', label: 'باص متوسط' },
      { value: 'LARGE_BUS', label: 'باص كبير' },
      { value: 'COASTER', label: 'كوستر' },
      { value: 'SCHOOL_BUS', label: 'حافلة مدرسية' },
    ]},
    { name: 'make', label: 'الماركة' },
    { name: 'model', label: 'الموديل' },
    { name: 'year', label: 'سنة الصنع', type: 'number' as const },
    { name: 'price', label: 'السعر', type: 'number' as const },
    { name: 'passengerCapacity', label: 'عدد الركاب', type: 'number' as const },
    { name: 'governorate', label: 'المحافظة' },
    { name: 'description', label: 'الوصف', type: 'textarea' as const },
  ];

  const redirectPath =
    data?.busListingType === 'BUS_RENT' ? `/rental/bus/${id}` : `/sale/bus/${id}`;

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
      redirectPath={redirectPath}
      uploadEndpoint={`/uploads/buses/${id}/images`}
      deleteImageFn={(imageId) => removeBusImage.mutateAsync(imageId)}
    />
  );
}
