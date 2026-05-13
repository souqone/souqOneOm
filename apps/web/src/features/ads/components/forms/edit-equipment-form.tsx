'use client';

import { useParams } from 'next/navigation';
import { EquipmentFormShell } from './equipment/EquipmentFormShell';

export function EditEquipmentForm() {
  const { id } = useParams<{ id: string }>();
  return <EquipmentFormShell mode="edit" id={id} />;
}
