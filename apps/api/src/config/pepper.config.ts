import { isPlaceholderSecret } from './env.validator';

export const MIN_AUTH_PEPPER_LENGTH = 32;
export const DEV_FALLBACK_AUTH_PEPPER = 'dev-test-auth-pepper-minimum-32-chars-long-for-testing!!';

export function getAuthPepper(): string {
  const pepper = process.env.AUTH_PEPPER;
  const env = process.env.NODE_ENV;

  if (env === 'production') {
    if (!pepper || pepper.trim() === '') {
      throw new Error('AUTH_PEPPER environment variable is required in production');
    }
    if (isPlaceholderSecret(pepper)) {
      throw new Error(
        'AUTH_PEPPER contains an unrunnable placeholder in production. Refusing to boot.',
      );
    }
    if (pepper.length < MIN_AUTH_PEPPER_LENGTH) {
      throw new Error(
        `AUTH_PEPPER must be at least ${MIN_AUTH_PEPPER_LENGTH} characters long in production`,
      );
    }
    return pepper;
  }

  if (env === 'development' || env === 'test') {
    if (pepper && !isPlaceholderSecret(pepper)) {
      if (pepper.length < MIN_AUTH_PEPPER_LENGTH) {
        throw new Error(
          `AUTH_PEPPER must be at least ${MIN_AUTH_PEPPER_LENGTH} characters long`,
        );
      }
      return pepper;
    }
    return DEV_FALLBACK_AUTH_PEPPER;
  }

  // Any other environment: enforce strictly
  if (!pepper || pepper.trim() === '') {
    throw new Error('AUTH_PEPPER environment variable is required');
  }
  if (isPlaceholderSecret(pepper)) {
    throw new Error('AUTH_PEPPER contains an unrunnable placeholder. Refusing to boot.');
  }
  if (pepper.length < MIN_AUTH_PEPPER_LENGTH) {
    throw new Error(
      `AUTH_PEPPER must be at least ${MIN_AUTH_PEPPER_LENGTH} characters long`,
    );
  }
  return pepper;
}
