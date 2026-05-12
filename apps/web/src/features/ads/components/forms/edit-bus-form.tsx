'use client';

import { useParams } from 'next/navigation';
import { BusFormShell } from './bus/BusFormShell';

export function EditBusForm() {
  const { id } = useParams<{ id: string }>();
  return <BusFormShell mode="edit" id={id} />;
}
