/**
 * Authentication and verification constants.
 */
export const VERIFICATION_CODE_TTL_MINUTES = 15;
export const VERIFICATION_CODE_TTL_MS = VERIFICATION_CODE_TTL_MINUTES * 60 * 1000;
export const VERIFICATION_TOKEN_TTL = '15m';
export const MAX_VERIFY_ATTEMPTS = 5;

export const OTP_TTL_SECONDS = VERIFICATION_CODE_TTL_MINUTES * 60; // 900 seconds (15 minutes)
export const PHONE_OTP_TTL_SECONDS = 5 * 60; // 300 seconds (5 minutes)
export const REFRESH_GRACE_SECONDS = 30;

export const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'support',
  'souqone',
  'root',
  'moderator',
  'system',
] as const;


