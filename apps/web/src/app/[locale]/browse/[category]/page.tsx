import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { VALID_CATEGORIES, CATEGORY_META } from '@/features/listings/types/category.types'
import type { ListingCategory } from '@/features/listings/types/category.types'

interface PageProps {
  params: Promise<{ locale: string; category: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateStaticParams() {
  return VALID_CATEGORIES.map(category => ({ category }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  if (!VALID_CATEGORIES.includes(category as ListingCategory)) return {}

  const meta = CATEGORY_META[category as ListingCategory]
  return {
    title: `${meta.labelAr} — سوق وان`,
    description: `تصفح إعلانات ${meta.labelAr} في عُمان`,
  }
}

/**
 * Redirect /browse/[category] → /browse?category=[category]
 * Preserves all existing search params (q, filters, etc.)
 */
export default async function BrowseCategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params

  if (!VALID_CATEGORIES.includes(category as ListingCategory)) {
    redirect('/browse')
  }

  const sp = await searchParams
  const qs = new URLSearchParams()
  qs.set('category', category)

  // Preserve all existing params
  for (const [key, value] of Object.entries(sp)) {
    if (key !== 'category' && value) {
      qs.set(key, Array.isArray(value) ? value[0] : value)
    }
  }

  redirect(`/browse?${qs.toString()}`)
}
