import validator from 'validator';

/**
 * Masks an email address for privacy and PII protection in logs and public responses.
 * Pattern: firstChar + '***@' + domain (e.g. mahmoud@example.com -> m***@example.com)
 * Returns null if input is null, undefined, empty, or not a valid email structure.
 */
export function maskEmail(email?: string | null): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0 || atIndex === trimmed.length - 1 || !validator.isEmail(trimmed)) {
    return null;
  }
  const firstChar = trimmed.charAt(0);
  const domain = trimmed.slice(atIndex + 1);
  return `${firstChar}***@${domain}`;
}

/**
 * Returns masked email or a fallback safe placeholder ('***') for logging.
 */
export function maskEmailSafe(email?: string | null): string {
  return maskEmail(email) ?? '***';
}

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/g;

/**
 * Redacts any full email addresses found within arbitrary text (e.g., error messages).
 */
export function redactEmails(text?: string | null): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return text.replace(EMAIL_PATTERN, (match) => maskEmailSafe(match));
}
