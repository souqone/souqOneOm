export type DeletionReauthMethod = 'password' | 'google' | 'apple' | 'confirmation';

export interface DeletionReauthCandidate {
  passwordHash?: string | null;
  googleId?: string | null;
  appleSub?: string | null;
}

/**
 * Determines the primary re-authentication method for account deletion.
 * In order: password -> google -> apple -> confirmation
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
  if (user?.appleSub) {
    return 'apple';
  }
  return 'confirmation';
}

/**
 * Returns all available re-authentication methods for the account.
 */
export function getAvailableDeletionReauthMethods(
  user: DeletionReauthCandidate | null | undefined,
): DeletionReauthMethod[] {
  const methods: DeletionReauthMethod[] = [];
  if (user?.passwordHash) {
    methods.push('password');
  }
  if (user?.googleId) {
    methods.push('google');
  }
  if (user?.appleSub) {
    methods.push('apple');
  }
  if (methods.length === 0) {
    methods.push('confirmation');
  }
  return methods;
}
