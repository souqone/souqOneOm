'use client';

import { useParams } from 'next/navigation';
import { JobFormShell } from './jobs/JobFormShell';

export function EditJobForm() {
  const { id } = useParams<{ id: string }>();
  return <JobFormShell mode="edit" id={id} />;
}
