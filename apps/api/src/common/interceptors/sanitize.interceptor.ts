import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EXPOSE_PHONE_KEY } from '../decorators/expose-phone.decorator';

/**
 * Fields that must NEVER be returned in any API response.
 * This interceptor acts as a safety net on top of Prisma `select`.
 */
export const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'googleId',
  'tokenVersion',
  'passwordResetCode',
  'passwordResetExpiry',
  'verificationCode',
  'verificationExpiry',
  'emailVerificationCode',
  'emailVerificationExpiry',
  'refreshTokenHash',
  'secret',
];

/**
 * Legacy contact fields that are ALWAYS stripped from all public and private responses,
 * even if @ExposePhone() is active. Note: `whatsappEnabled` is explicitly kept.
 */
export const ALWAYS_STRIP_FIELDS = [
  ...SENSITIVE_FIELDS,
  'contactPhone',
  'whatsapp',
  'phoneE164',
];

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

export function stripSensitive(data: unknown, exposePhone = false): unknown {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map((item) => stripSensitive(item, exposePhone));
  }

  // Only sanitize plain objects — leave Date, Decimal, Buffer, StreamableFile, and class instances untouched
  if (isPlainObject(data)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (ALWAYS_STRIP_FIELDS.includes(key)) {
        continue;
      }
      if (key === 'phone' && !exposePhone) {
        continue;
      }
      cleaned[key] = stripSensitive(value, exposePhone);
    }
    return cleaned;
  }

  return data;
}

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  constructor(private readonly reflector?: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    let exposePhone = false;
    if (this.reflector) {
      try {
        const handler = context.getHandler();
        const targetClass = context.getClass();
        if (handler && targetClass) {
          exposePhone = Boolean(
            this.reflector.getAllAndOverride<boolean>(EXPOSE_PHONE_KEY, [
              handler,
              targetClass,
            ]),
          );
        }
      } catch {
        exposePhone = false;
      }
    }

    return next.handle().pipe(map((data) => stripSensitive(data, exposePhone)));
  }
}
