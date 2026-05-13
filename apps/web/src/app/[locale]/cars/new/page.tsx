'use client';

import { Suspense } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { AddCarForm } from '@/features/ads/components/forms/add-car-form';

export default function AddCarPage() {
  return (
    <AuthGuard>
      <Navbar />
      <main className="pt-[75px] pb-12 px-4">
        <Suspense fallback={<div className="animate-pulse bg-[var(--color-surface-container)] h-96 rounded-3xl max-w-2xl mx-auto" />}>
          <AddCarForm />
        </Suspense>
      </main>
      <Footer />
    </AuthGuard>
  );
}
