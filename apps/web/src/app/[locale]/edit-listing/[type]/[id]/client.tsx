'use client';

import dynamic from 'next/dynamic';

const EDIT_FORMS: Record<string, React.ComponentType> = {
  bus: dynamic(() => import('@/features/ads/components/forms/edit-bus-form').then(m => ({ default: m.EditBusForm }))),
  equipment: dynamic(() => import('@/features/ads/components/forms/edit-equipment-form').then(m => ({ default: m.EditEquipmentForm }))),
  parts: dynamic(() => import('@/features/ads/components/forms/edit-parts-form').then(m => ({ default: m.EditPartsForm }))),
  service: dynamic(() => import('@/features/ads/components/forms/edit-service-form').then(m => ({ default: m.EditServiceForm }))),
  operator: dynamic(() => import('@/features/ads/components/forms/edit-operator-form').then(m => ({ default: m.EditOperatorForm }))),
};

interface EditListingClientProps {
  type: string;
}

export function EditListingClient({ type }: EditListingClientProps) {
  const FormComponent = EDIT_FORMS[type];
  if (!FormComponent) return null;
  return <FormComponent />;
}
