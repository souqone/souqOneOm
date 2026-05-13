'use client';

import { useParams } from 'next/navigation';
import { OperatorFormShell } from './operator/OperatorFormShell';

export function EditOperatorForm() {
  const { id } = useParams<{ id: string }>();
  return <OperatorFormShell mode="edit" id={id} />;
}
