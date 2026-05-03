import { Suspense } from 'react'
import RequestDetailShell from '@/features/transport/RequestDetailShell'

interface Props { params: Promise<{ id: string }> }

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <Suspense fallback={<div className="h-64 animate-pulse bg-surface-dim rounded-xl m-8" />}>
      <RequestDetailShell id={id} />
    </Suspense>
  )
}
