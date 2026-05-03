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
    { name: 'title', label: 'عنوان الإعلان', required: true },
    { name: 'serviceType', label: 'نوع الخدمة', type: 'select' as const, options: [
      { value: 'MAINTENANCE', label: 'صيانة' },
      { value: 'REPAIR', label: 'تصليح' },
      { value: 'DETAILING', label: 'تلميع وتنظيف' },
      { value: 'TINTING', label: 'تظليل' },
      { value: 'ACCESSORIES', label: 'إكسسوارات' },
      { value: 'INSPECTION', label: 'فحص' },
      { value: 'INSURANCE_SERVICE', label: 'خدمة تأمين' },
      { value: 'OTHER', label: 'أخرى' },
    ]},
    { name: 'price', label: 'السعر', type: 'number' as const },
    { name: 'governorate', label: 'المحافظة' },
    { name: 'phone', label: 'رقم الهاتف' },
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
      redirectPath={`/sale/service/${id}`}
      uploadEndpoint={`/uploads/services/${id}/images`}
      deleteImageFn={(imageId) => removeServiceImage.mutateAsync(imageId)}
    />
  );
}
