import { Suspense } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import BookingDetailShell from '@/features/transport/BookingDetailShell'

interface Props { params: Promise<{ id: string }> }

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <AuthGuard>
      <Suspense fallback={<div className="h-64 animate-pulse bg-surface-dim rounded-xl m-8" />}>
        <BookingDetailShell id={id} />
      </Suspense>
    </AuthGuard>
  )
}
