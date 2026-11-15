export const USER_ONLINE_KEY_PREFIX = 'user:online:';

/**
 * Single source of truth for Redis online presence keys.
 * Matches ChatGateway (`TTL 600s`, deleted on disconnect).
 */
export function userOnlineKey(userId: string): string {
  return `${USER_ONLINE_KEY_PREFIX}${userId}`;
}
