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

export interface StrictPhoneResult {
  e164: string;
  countryCode: string;
}

export interface StrictPhoneOptions {
  allowedCountryCodes?: string[];
}

/**
 * Returns allowed country codes for strict phone validation from environment.
 * Default in production: ['968'] (Oman only).
 * Default in non-production: ['968', '20'] (Oman and Egypt).
 */
export function getAllowedCountryCodes(): string[] {
  const envVal = process.env.PHONE_ALLOWED_COUNTRY_CODES;
  if (envVal !== undefined && envVal.trim() !== '') {
    return envVal
      .split(',')
      .map((c) => c.replace(/[^\d]/g, '').trim())
      .filter(Boolean);
  }
  const isProd = process.env.NODE_ENV === 'production';
  return isProd ? ['968'] : ['968', '20'];
}

/**
 * Strict phone normalizer for new writes.
 * - Oman (+968): 8 digits starting with 7 or 9.
 *   Bare 8-digit numbers without country code are interpreted as Omani only.
 * - Egypt (+20): 10 digits starting with 1 (after stripping local leading 0).
 *   Bare 11-digit numbers starting with 01 are interpreted as Egyptian local.
 * - Validates countryCode against allowedCountryCodes.
 * - Returns { e164, countryCode } on success, or null on failure.
 */
export function normalizePhoneStrict(
  raw: string | null | undefined,
  opts?: StrictPhoneOptions,
): StrictPhoneResult | null {
  if (!raw || typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Reject any character outside: digits, +, spaces, dashes, parentheses, dot
  if (/[^\d+\s\-().]/.test(trimmed)) {
    return null;
  }

  // Plus sign (+) is only allowed at the very beginning (index 0) of the trimmed input
  const plusCount = (trimmed.match(/\+/g) || []).length;
  if (plusCount > 1 || (plusCount === 1 && !trimmed.startsWith('+'))) {
    return null;
  }

  let cleaned = trimmed.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);


  let countryCode: string | null = null;
  let nationalNumber: string | null = null;

  if (cleaned.startsWith('+')) {
    if (cleaned.startsWith('+968')) {
      const rest = cleaned.slice(4);
      if (/^[79]\d{7}$/.test(rest)) {
        countryCode = '968';
        nationalNumber = rest;
      }
    } else if (cleaned.startsWith('+20')) {
      let rest = cleaned.slice(3);
      if (rest.startsWith('0')) {
        rest = rest.slice(1);
      }
      if (/^1\d{9}$/.test(rest)) {
        countryCode = '20';
        nationalNumber = rest;
      }
    }
  } else {
    // Bare numbers without country code
    if (/^\d{8}$/.test(cleaned)) {
      // Bare 8-digit numbers are interpreted as Omani only
      if (/^[79]\d{7}$/.test(cleaned)) {
        countryCode = '968';
        nationalNumber = cleaned;
      }
    } else if (/^01\d{9}$/.test(cleaned)) {
      // Bare 11-digit numbers starting with 01 are Egyptian local
      countryCode = '20';
      nationalNumber = cleaned.slice(1); // strip leading 0
    }
  }

  if (!countryCode || !nationalNumber) {
    return null;
  }

  const allowed = opts?.allowedCountryCodes ?? getAllowedCountryCodes();
  if (!allowed.includes(countryCode)) {
    return null;
  }

  return {
    e164: `+${countryCode}${nationalNumber}`,
    countryCode,
  };
}

