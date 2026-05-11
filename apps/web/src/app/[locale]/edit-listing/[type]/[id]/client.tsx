'use client';

import dynamic from 'next/dynamic';
import { AuthGuard } from '@/components/auth-guard';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const EDIT_FORMS: Record<string, React.ComponentType> = {
  car: dynamic(() => import('@/features/ads/components/forms/edit-car-form').then(m => ({ default: m.EditCarForm }))),
  job: dynamic(() => import('@/features/ads/components/forms/edit-job-form').then(m => ({ default: m.EditJobForm }))),
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

  return (
    <AuthGuard>
      <Navbar />
      <div className="pt-[75px] pb-16 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <FormComponent />
      </div>
      <Footer />
    </AuthGuard>
  );
}
