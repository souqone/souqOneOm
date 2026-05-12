'use client';

import { useParams } from 'next/navigation';
import { ServiceFormShell } from './service/ServiceFormShell';

export function EditServiceForm() {
  const { id } = useParams<{ id: string }>();
  return <ServiceFormShell mode="edit" id={id} />;
}
