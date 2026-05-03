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
    { name: 'title', label: 'عنوان الإعلان', required: true },
    { name: 'equipmentType', label: 'نوع المعدة', type: 'select' as const, options: [
      { value: 'EXCAVATOR', label: 'حفار' },
      { value: 'LOADER', label: 'لودر' },
      { value: 'BULLDOZER', label: 'جرافة' },
      { value: 'CRANE', label: 'رافعة' },
      { value: 'FORKLIFT', label: 'رافعة شوكية' },
      { value: 'GENERATOR', label: 'مولد كهربائي' },
      { value: 'COMPRESSOR', label: 'كمبريسور' },
      { value: 'CONCRETE_MIXER', label: 'خلاطة خرسانة' },
      { value: 'DUMP_TRUCK', label: 'شاحنة قلاب' },
      { value: 'OTHER', label: 'أخرى' },
    ]},
    { name: 'make', label: 'الماركة' },
    { name: 'model', label: 'الموديل' },
    { name: 'year', label: 'سنة الصنع', type: 'number' as const },
    { name: 'price', label: 'السعر', type: 'number' as const },
    { name: 'condition', label: 'الحالة', type: 'select' as const, options: [
      { value: 'NEW', label: 'جديد' },
      { value: 'USED', label: 'مستعمل' },
      { value: 'REFURBISHED', label: 'مجدد' },
    ]},
    { name: 'governorate', label: 'المحافظة' },
    { name: 'description', label: 'الوصف', type: 'textarea' as const },
  ];

  const redirectPath =
    data?.listingType === 'EQUIPMENT_RENT'
      ? `/rental/equipment/${id}`
      : `/sale/equipment/${id}`;

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
      uploadEndpoint={`/uploads/equipment/${id}/images`}
      deleteImageFn={(imageId) => removeEquipImage.mutateAsync(imageId)}
    />
  );
}
