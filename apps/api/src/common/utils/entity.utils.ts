/**
 * Shared utilities used across multiple modules.
 */

export { USER_SELECT_DETAIL as USER_SELECT } from '../constants/user-select.constant';

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
