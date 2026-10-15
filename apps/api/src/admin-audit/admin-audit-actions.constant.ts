/**
 * Admin Audit Log Actions Constants.
 * Used to classify actions executed by administrators.
 */
export const USER_SUSPEND = 'USER_SUSPEND';
export const USER_UNSUSPEND = 'USER_UNSUSPEND';
export const USER_BAN = 'USER_BAN';
export const USER_UNBAN = 'USER_UNBAN';
export const ROLE_CHANGE = 'ROLE_CHANGE';

export const ADMIN_AUDIT_ACTIONS = {
  USER_SUSPEND,
  USER_UNSUSPEND,
  USER_BAN,
  USER_UNBAN,
  ROLE_CHANGE,
} as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[keyof typeof ADMIN_AUDIT_ACTIONS];
