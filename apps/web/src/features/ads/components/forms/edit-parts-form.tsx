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
    { name: 'title', label: 'عنوان الإعلان', required: true },
    { name: 'partCategory', label: 'فئة القطعة', type: 'select' as const, options: [
      { value: 'ENGINE', label: 'محرك' },
      { value: 'TRANSMISSION', label: 'ناقل الحركة' },
      { value: 'BRAKES', label: 'فرامل' },
      { value: 'SUSPENSION', label: 'تعليق' },
      { value: 'ELECTRICAL', label: 'كهرباء' },
      { value: 'BODY', label: 'هيكل' },
      { value: 'INTERIOR', label: 'داخلية' },
      { value: 'TIRES_WHEELS', label: 'إطارات وجنوط' },
      { value: 'OTHER', label: 'أخرى' },
    ]},
    { name: 'condition', label: 'الحالة', type: 'select' as const, options: [
      { value: 'NEW', label: 'جديد' },
      { value: 'USED', label: 'مستعمل' },
      { value: 'REFURBISHED', label: 'مجدد' },
    ]},
    { name: 'compatibleMake', label: 'ماركة متوافقة' },
    { name: 'compatibleModel', label: 'موديل متوافق' },
    { name: 'price', label: 'السعر', type: 'number' as const },
    { name: 'governorate', label: 'المحافظة' },
    { name: 'description', label: 'الوصف', type: 'textarea' as const },
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
      uploadEndpoint={`/uploads/parts/${id}/images`}
      deleteImageFn={(imageId) => removePartImage.mutateAsync(imageId)}
    />
  );
}
