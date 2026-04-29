'use client';

import { Suspense } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { AddPartForm } from '@/features/ads/components/forms/add-part-form';

export default function AddPartPage() {
  return (
    <AuthGuard>
      <Navbar />
      <main className="pt-[75px] pb-8 max-w-[900px] mx-auto px-4 md:px-8">
        <Suspense fallback={<div className="animate-pulse bg-surface-container-low h-96 rounded-3xl" />}>
          <AddPartForm />
        </Suspense>
      </main>
      <Footer />
    </AuthGuard>
  );
}
