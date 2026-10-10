import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import validator from 'validator';

/**
 * Normalizes an email address:
 * 1. Strips all Unicode category `Cf` (format) characters anywhere in the string.
 *    This removes RLM (U+200F), LRM (U+200E), directional embeddings/isolates, BOM, ZWSP, etc.
 * 2. Trims leading and trailing whitespace.
 * 3. Converts to lowercase.
 */
export function normalizeEmail(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/\p{Cf}/gu, '')
    .trim()
    .toLowerCase();
}

/**
 * Validates normalized email:
 * 1. Must be a non-empty string.
 * 2. Length must not exceed 254 characters (RFC 5321).
 * 3. Must be purely ASCII characters (no non-ASCII bytes allowed for email delivery).
 * 4. Must satisfy standard email format per validator.isEmail.
 */
export function isValidNormalizedEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  // Strictly printable ASCII (no control chars, no high Unicode)
  if (!/^[\x20-\x7E]+$/.test(email)) return false;
  return validator.isEmail(email);
}

/**
 * Class-validator decorator for normalized email validation.
 * Normalizes the email internally and verifies validity.
 */
export function IsNormalizedEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNormalizedEmail',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'البريد الإلكتروني غير صالح',
        ...validationOptions,
      },
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          const normalized = normalizeEmail(value);
          return isValidNormalizedEmail(normalized);
        },
      },
    });
  };
}
