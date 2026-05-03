'use client'

import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { CreateRequestFlow } from '@/features/transport/CreateRequestFlow'

export default function NewTransportRequestPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <CreateRequestFlow />
      <Footer />
    </div>
  )
}
