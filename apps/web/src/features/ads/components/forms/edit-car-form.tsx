'use client';

import { useParams } from 'next/navigation';
import { CarFormShell } from './car/CarFormShell';

export function EditCarForm() {
  const { id } = useParams<{ id: string }>();
  return <CarFormShell mode="edit" id={id} />;
}
