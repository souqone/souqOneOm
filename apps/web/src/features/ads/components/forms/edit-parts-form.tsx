'use client';

import { useParams } from 'next/navigation';
import { PartFormShell } from './part/PartFormShell';

export function EditPartsForm() {
  const { id } = useParams<{ id: string }>();
  return <PartFormShell mode="edit" id={id} />;
}
