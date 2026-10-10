/**
 * Authentication and verification constants.
 */
export const VERIFICATION_CODE_TTL_MINUTES = 15;
export const VERIFICATION_CODE_TTL_MS = VERIFICATION_CODE_TTL_MINUTES * 60 * 1000;

export const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'support',
  'souqone',
  'root',
  'moderator',
  'system',
] as const;

