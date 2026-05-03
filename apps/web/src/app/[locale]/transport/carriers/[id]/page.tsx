import { Suspense } from 'react'
import CarrierProfileShell from '@/features/transport/CarrierProfileShell'

interface Props { params: Promise<{ id: string }> }

export default async function CarrierProfilePage({ params }: Props) {
  const { id } = await params
  return (
    <Suspense fallback={<div className="h-64 animate-pulse bg-surface-dim rounded-xl m-8" />}>
      <CarrierProfileShell id={id} />
    </Suspense>
  )
}
