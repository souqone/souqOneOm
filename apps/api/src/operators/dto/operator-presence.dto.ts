/**
 * Presence fields attached to public operator listing responses.
 * Backed by Redis presence keys (`user:online:${userId}`) without exposing userId or PII.
 */
export interface OperatorPresenceFields {
  /**
   * Whether the operator account currently has an active online session in Redis.
   * Defaults to `false` when offline or when Redis is unavailable.
   */
  isOnline: boolean;
}
