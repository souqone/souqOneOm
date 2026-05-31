'use client';

import { Suspense } from 'react';
import { JobsPageGuard } from '@/features/jobs/components/jobs-page-guard';
import { JobFormShell } from '@/features/ads/components/forms/jobs/JobFormShell';

export default function CreateJobPage() {
  return (
    <JobsPageGuard role="any">
      <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><span className="material-symbols-outlined animate-spin text-[var(--color-brand-navy)] text-4xl">progress_activity</span></div>}>
        <main className="pt-[75px] pb-12 px-4">
          <JobFormShell mode="add" />
        </main>
      </Suspense>
    </JobsPageGuard>
  );
}
