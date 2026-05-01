import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { VALID_CATEGORIES, CATEGORY_META } from '@/features/listings/types/category.types'
import type { ListingCategory } from '@/features/listings/types/category.types'
import { ListingsPageShell } from '@/features/listings/components/ListingsPageShell'

interface PageProps {
  params: Promise<{ locale: string; category: string }>
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

export default async function BrowseCategoryPage({ params }: PageProps) {
  const { category } = await params

  if (!VALID_CATEGORIES.includes(category as ListingCategory)) {
    redirect('/browse')
  }

  return <ListingsPageShell category={category as ListingCategory} />
}
