import { Suspense } from 'react'
import TransportBrowseShell from '@/features/transport/TransportBrowseShell'

export default function TransportBrowsePage() {
  return (
    <Suspense>
      <TransportBrowseShell />
    </Suspense>
  )
}
