/**
 * Utilities for masking personally identifiable information (PII)
 * in admin-facing responses.
 *
 * Rules:
 * - Email: first char + '***' + '@' + domain (e.g. m***@example.test)
 * - Phone: country code + '***' + last 2 digits (e.g. +968***67)
 */

export { maskEmail } from '../../common/utils/mask-email';

export function maskPhone(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 4) {
    return null;
  }

  const lastTwo = digitsOnly.slice(-2);

  // Check if international prefix exists (+968 or similar)
  if (phone.trim().startsWith('+')) {
    // Extract country code (up to 4 digits after +)
    // E.g. +96891234567 -> country code 968
    if (digitsOnly.startsWith('968') && digitsOnly.length > 5) {
      return `+968***${lastTwo}`;
    }
    // Generic international format
    const match = phone.trim().match(/^(\+\d{1,3})/);
    const code = match ? match[1] : '+968';
    return `${code}***${lastTwo}`;
  }

  // If starts with 968 without +
  if (digitsOnly.startsWith('968') && digitsOnly.length === 11) {
    return `+968***${lastTwo}`;
  }

  // Standard 8-digit Oman local number (e.g. 91234567 or 71234567)
  if (digitsOnly.length === 8) {
    return `+968***${lastTwo}`;
  }

  // Fallback for other lengths
  return `+968***${lastTwo}`;
}
