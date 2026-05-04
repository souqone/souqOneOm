import { getImageUrl } from '@/lib/image-utils'

export interface NormalizedSeller {
  id: string
  name: string
  image?: string
  phone?: string
  whatsapp?: string
  governorate: string
  verified: boolean
  memberSince: string
  listingCount?: number
}

/** Type guard — true when value is a non-negative finite number or numeric string */
export function isValidPrice(value: unknown): value is number {
  if (typeof value === 'number') return !Number.isNaN(value) && value >= 0
  if (typeof value === 'string') {
    const num = Number(value)
    return !Number.isNaN(num) && num >= 0
  }
  return false
}

/** Parse a price value to number | undefined (undefined when null / NaN / negative) */
export function parsePrice(value: unknown): number | undefined {
  if (value == null) return undefined
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(num) || num < 0 ? undefined : num
}

/** Parse a price value to number, returning 0 as fallback */
export function parsePriceRequired(value: unknown): number {
  return parsePrice(value) ?? 0
}

/** Normalise an images array (objects with .url OR bare strings) to CDN URL strings */
export function normalizeImages(images: unknown): string[] {
  if (!Array.isArray(images)) return []
  return images
    .map((img) => {
      if (typeof img === 'string') return getImageUrl(img) || ''
      if (img && typeof img === 'object') {
        const url = (img as Record<string, unknown>).url
        return getImageUrl(url as string) || ''
      }
      return ''
    })
    .filter((url): url is string => url.length > 0)
}

/** Normalise a seller / user object from any listing API into a common shape */
export function normalizeSeller(
  seller: unknown,
  fallbackGovernorate: string | null | undefined,
  contactOverride?: { phone?: string | null; whatsapp?: string | null },
): NormalizedSeller {
  const s = seller as Record<string, unknown> | undefined | null
  const governorate = (s?.governorate as string) || fallbackGovernorate || ''
  const name = (s?.displayName as string) || (s?.username as string) || 'مستخدم'
  const createdAt = s?.createdAt as string | undefined
  const phone = contactOverride?.phone || (s?.phone as string) || undefined
  const whatsapp =
    contactOverride?.whatsapp ||
    contactOverride?.phone ||
    (s?.whatsapp as string) ||
    (s?.phone as string) ||
    undefined
  const countObj = s?._count as Record<string, number> | undefined
  const listingCount =
    countObj?.listings ?? countObj?.listing ?? (s?.listingCount as number) ?? undefined

  return {
    id: (s?.id as string) || '',
    name,
    image: (s?.avatarUrl as string) || undefined,
    phone: phone || undefined,
    whatsapp: whatsapp || undefined,
    governorate,
    verified: Boolean(s?.isVerified),
    memberSince: createdAt || new Date().toISOString(),
    listingCount,
  }
}
