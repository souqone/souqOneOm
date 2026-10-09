import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable, ExecutionContext } from '@nestjs/common';
import { verifyAccessToken } from '../../config/jwt.config';

/**
 * Resolves the throttler identity for a request:
 * - If already resolved and cached on req._throttleIdentity, returns it.
 * - If req.user?.sub is present and valid, returns `user-${cleanSub}`.
 * - Otherwise, if Authorization header matches strict "Bearer <token>" (<= 2048 chars, single space),
 *   verifies token via verifyAccessToken (HS256 pinned, dual-secret aware, expiry enforced).
 *   Accepts payload.sub ONLY if it is a non-empty string or finite number of length <= 64.
 *   If valid, returns `user-${cleanSub}`.
 * - Fallback: `ip-${req.ip || req.connection?.remoteAddress || 'unknown'}`.
 * - Caches result on req._throttleIdentity only after decision is complete.
 */
export function resolveThrottleIdentity(req: Record<string, any>): string {
  if (typeof req._throttleIdentity === 'string') {
    return req._throttleIdentity;
  }

  let rawSub: unknown = req.user?.sub;

  const authHeader = req.headers?.authorization;
  if (!rawSub && typeof authHeader === 'string' && authHeader.length <= 2048) {
    const bearerMatch = authHeader.match(/^Bearer ([^\s]+)$/);
    if (bearerMatch) {
      const token = bearerMatch[1];
      try {
        const payload = verifyAccessToken<Record<string, unknown>>(token);
        rawSub = payload?.sub;
      } catch {
        // Verification failed (invalid signature, wrong secret, expired, alg:none, malformed)
      }
    }
  }

  let cleanSub: string | null = null;
  if (typeof rawSub === 'string') {
    const trimmed = rawSub.trim();
    if (trimmed.length > 0 && trimmed.length <= 64) {
      cleanSub = trimmed;
    }
  } else if (typeof rawSub === 'number' && Number.isFinite(rawSub)) {
    const str = String(rawSub);
    if (str.length > 0 && str.length <= 64) {
      cleanSub = str;
    }
  }

  let identity: string;
  if (cleanSub) {
    identity = `user-${cleanSub}`;
  } else {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    identity = `ip-${ip}`;
  }

  req._throttleIdentity = identity;
  return identity;
}

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return resolveThrottleIdentity(req);
  }

  protected generateKey(context: ExecutionContext, suffix: string, name: string): string {
    return `${name}:${suffix}:${context.getClass().name}-${context.getHandler().name}`;
  }
}

