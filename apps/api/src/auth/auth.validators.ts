import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import validator from 'validator';
import { RESERVED_USERNAMES } from './auth.constants';

/**
 * Normalizes numeric digits:
 * 1. Returns empty string if input is not a string.
 * 2. Converts Arabic-Indic (U+0660..U+0669) and Persian (U+06F0..U+06F9) digits to ASCII using code point arithmetic.
 * 3. Strips all Unicode category `Cf` characters.
 * 4. Trims whitespace.
 */
export function normalizeDigits(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[\u0660-\u0669]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x0660 + 0x30))
    .replace(/[\u06F0-\u06F9]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x06F0 + 0x30))
    .replace(/\p{Cf}/gu, '')
    .trim();
}

/**
 * Strips \p{Cf} characters and trims displayName.
 */
export function cleanDisplayName(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  return raw.replace(/\p{Cf}/gu, '').trim();
}

/**
 * Class-validator decorator to validate UTF-8 byte length.
 */
export function MaxBytes(max: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'maxBytes',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [max],
      options: {
        message: 'كلمة المرور طويلة جداً',
        ...validationOptions,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          const [limit] = args.constraints;
          return Buffer.byteLength(value, 'utf8') <= limit;
        },
      },
    });
  };
}

/**
 * Class-validator decorator to prevent using system-reserved usernames.
 */
export function IsNotReservedUsername(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNotReservedUsername',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'اسم المستخدم غير متاح',
        ...validationOptions,
      },
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return true;
          const lower = value.trim().toLowerCase();
          return !RESERVED_USERNAMES.includes(lower as any);
        },
      },
    });
  };
}


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
