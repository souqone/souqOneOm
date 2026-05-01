import type { Metadata } from 'next'
import { SellerPageClient } from '@/components/seller/SellerPageClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata(_props: PageProps): Promise<Metadata> {
  return {
    title: `صفحة البائع — سوق وان`,
    description: `تصفح إعلانات البائع في سوق وان`,
  }
}

export default async function SellerPage() {
  return <SellerPageClient />
}
