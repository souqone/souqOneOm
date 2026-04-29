import { notFound } from 'next/navigation';
import { EditListingClient } from './client';

const SUPPORTED_TYPES = ['bus', 'equipment', 'parts', 'service', 'operator'];

interface Props {
  params: Promise<{ type: string; id: string }>;
}

export default async function EditListingPage({ params }: Props) {
  const { type } = await params;

  if (!SUPPORTED_TYPES.includes(type)) {
    notFound();
  }

  return <EditListingClient type={type} />;
}
