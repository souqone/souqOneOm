import { getImageUrl } from '@/lib/image-utils'

/** Returns the CDN URL for the primary image in a listing images array, or null */
export function getPrimaryImage(
  images?: { url: string; isPrimary?: boolean }[],
): string | null {
  if (!images || images.length === 0) return null
  const primary = images.find((img) => img.isPrimary) ?? images[0]
  return getImageUrl(primary?.url) ?? null
}
