import { RedisService } from '../../redis/redis.service';

const VIEW_COOLDOWN_SECONDS = 3600; // 1 hour

/**
 * Rate-limited view counter.
 * Prevents the same IP from inflating viewCount within the cooldown window.
 * Returns true if the view was counted, false if it was a duplicate.
 *
 * L-1: uses atomic SET NX — no race window between the old GET + SET pattern.
 */
export async function incrementViewCount(
  redis: RedisService,
  entityType: string,
  entityId: string,
  ip?: string,
): Promise<boolean> {
  if (!ip) return true; // No IP = count it (fallback)

  const key = `view:${entityType}:${entityId}:${ip}`;
  // setNX returns true only if key was absent — atomic, no race condition
  return redis.setNX(key, '1', VIEW_COOLDOWN_SECONDS);
}
