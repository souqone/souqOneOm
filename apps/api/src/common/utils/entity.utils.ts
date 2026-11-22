/**
 * Shared utilities used across multiple modules.
 */

export { USER_SELECT_LISTING_PUBLIC as USER_SELECT } from '../constants/user-select.constant';

/**
 * Shared Prisma include fragment for list/card queries that fetch only the primary cover image
 * (`take: 1`) while also returning `_count.images` so list cards can show the total photo count.
 */
export const LIST_FIRST_IMAGE_AND_COUNT_INCLUDE = {
  images: { orderBy: { order: 'asc' as const }, take: 1 },
  _count: { select: { images: true } },
} as const;

/**
 * Generate a URL-safe slug that supports Arabic characters.
 * Falls back to a cuid-style slug if the title produces an empty base.
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\u0600-\u06FF\w\s-]/g, '')   // keep Arabic, alphanumeric, spaces, hyphens
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const suffix = Date.now().toString(36);
  return base ? `${base}-${suffix}` : suffix;
}
