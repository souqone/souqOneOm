'use client';

import { Suspense } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { AddCarForm } from '@/features/ads/components/forms/add-car-form';
import { AddBusForm } from '@/features/ads/components/forms/add-bus-form';
import { AddEquipmentForm } from '@/features/ads/components/forms/add-equipment-form';
import { AddPartForm } from '@/features/ads/components/forms/add-part-form';
import { AddServiceForm } from '@/features/ads/components/forms/add-service-form';
import { AddOperatorForm } from '@/features/ads/components/forms/add-operator-form';

const FORM_MAP: Record<string, React.ComponentType> = {
  car: AddCarForm,
  bus: AddBusForm,
  equipment: AddEquipmentForm,
  parts: AddPartForm,
  service: AddServiceForm,
  operator: AddOperatorForm,
};

export default function AddListingByTypePage() {
  const { type } = useParams<{ type: string }>();

  const FormComponent = FORM_MAP[type];
  if (!FormComponent) return notFound();

  return (
    <AuthGuard>
      <Navbar />
      <main className="pt-[75px] pb-8 max-w-[900px] mx-auto px-4 md:px-8">
        <Suspense fallback={<div className="animate-pulse bg-surface-container-low h-96 rounded-3xl" />}>
          <FormComponent />
        </Suspense>
      </main>
      <Footer />
    </AuthGuard>
  );
}
