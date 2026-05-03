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
    { name: 'title', label: 'عنوان الإعلان', required: true },
    { name: 'operatorType', label: 'نوع المشغّل', type: 'select' as const, options: [
      { value: 'DRIVER', label: 'سائق' },
      { value: 'OPERATOR', label: 'مشغّل' },
      { value: 'TECHNICIAN', label: 'فني' },
    ]},
    { name: 'experienceYears', label: 'سنوات الخبرة', type: 'number' as const },
    { name: 'dailyRate', label: 'الأجر اليومي', type: 'number' as const },
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
      redirectPath={`/equipment/operators/${id}`}
    />
  );
}
