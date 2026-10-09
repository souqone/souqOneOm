import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Fields that must NEVER be returned in any API response.
 * This interceptor acts as a safety net on top of Prisma `select`.
 */
export const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
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

function stripSensitive(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map(stripSensitive);
  }

  if (typeof data === 'object' && data !== null) {
    // Handle Date, Decimal, and other non-plain objects
    if (data instanceof Date) return data;
    if (typeof (data as any).toJSON === 'function' && data.constructor !== Object) return data;

    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_FIELDS.includes(key)) continue;
      cleaned[key] = stripSensitive(value);
    }
    return cleaned;
  }

  return data;
}

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map(stripSensitive));
  }
}
