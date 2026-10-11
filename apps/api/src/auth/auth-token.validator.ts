import { UnauthorizedException } from '@nestjs/common';
import type { JwtPayload } from './auth.types';

/**
 * Asserts that a decoded JWT payload corresponds to a verified access token.
 * Throws UnauthorizedException with specific Arabic message and machine-readable code if:
 * 1. The payload is invalid or non-object.
 * 2. The payload contains a `purpose` claim (e.g. 'email-verify').
 * 3. The `verified` claim is missing or not strictly true.
 */
export function assertVerifiedAccessPayload(payload: any): asserts payload is JwtPayload & { verified: true } {
  if (!payload || typeof payload !== 'object') {
    throw new UnauthorizedException({
      message: 'رمز الدخول غير صالح',
      code: 'INVALID_TOKEN',
    });
  }

  if (payload.purpose) {
    throw new UnauthorizedException({
      message: 'رمز غير صالح لهذا المسار',
      code: 'INVALID_TOKEN_PURPOSE',
    });
  }

  if (payload.verified !== true) {
    throw new UnauthorizedException({
      message: 'يرجى توثيق البريد الإلكتروني أولاً',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
}
