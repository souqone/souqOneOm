export type DeletionReauthMethod = 'password' | 'google' | 'confirmation';

export interface DeletionReauthCandidate {
  passwordHash?: string | null;
  googleId?: string | null;
}

/**
 * Determines the required re-authentication method for account deletion.
 * Single source of truth shared between GET /users/me and POST /users/me/delete-account:
 * 1. If user has a passwordHash -> 'password'
 * 2. Else if user has a googleId -> 'google'
 * 3. Else (e.g. phone-only user) -> 'confirmation'
 */
export function getDeletionReauthMethod(
  user: DeletionReauthCandidate | null | undefined,
): DeletionReauthMethod {
  if (user?.passwordHash) {
    return 'password';
  }
  if (user?.googleId) {
    return 'google';
  }
  return 'confirmation';
}
