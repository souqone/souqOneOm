/**
 * Normalizes phone numbers to E.164 format.
 * - Handles existing E.164 numbers (+968XXXXXXXX).
 * - Converts 00-prefixed international numbers (00968... -> +968...).
 * - Converts bare 8-digit local Omani numbers to +968XXXXXXXX.
 * - Strips whitespace, hyphens, and non-numeric characters (except leading +).
 * - Validates final number contains between 8 and 15 digits.
 * - Returns null for invalid, garbage, or empty input.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = '+' + digits.slice(2);
  if (!digits.startsWith('+')) {
    if (digits.length === 8) digits = '+968' + digits;
    else return null;
  }
  const justDigits = digits.slice(1);
  if (!/^\d{8,15}$/.test(justDigits)) return null;
  return digits;
}
