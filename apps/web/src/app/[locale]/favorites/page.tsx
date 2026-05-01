import type { Metadata } from 'next'
import { FavoritesPageClient } from '@/components/favorites/FavoritesPageClient'

export const metadata: Metadata = {
  title: 'المفضلة — سوق وان',
  description: 'الإعلانات التي حفظتها',
}

export default function FavoritesPage() {
  return <FavoritesPageClient />
}
