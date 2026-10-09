import { isPlaceholderSecret } from './env.validator';

export const MIN_JWT_SECRET_LENGTH = 32;
export const DEV_FALLBACK_SECRET = 'dev-secret-minimum-32-chars-long-for-testing!!';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.trim() === '') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    if (isPlaceholderSecret(secret)) {
      throw new Error(
        'JWT_SECRET contains an unrunnable placeholder in production. Refusing to boot.',
      );
    }
    if (secret.length < MIN_JWT_SECRET_LENGTH) {
      throw new Error(
        `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long in production`,
      );
    }
    return secret;
  }

  // Non-production fallback
  if (secret && !isPlaceholderSecret(secret)) {
    if (secret.length < MIN_JWT_SECRET_LENGTH) {
      throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`);
    }
    return secret;
  }

  return DEV_FALLBACK_SECRET;
}

export function getJwtPreviousSecret(): string | undefined {
  const prev = process.env.JWT_PREVIOUS_SECRET;
  if (!prev || prev.trim() === '') {
    return undefined;
  }

  if (process.env.NODE_ENV === 'production') {
    if (isPlaceholderSecret(prev)) {
      throw new Error(
        'JWT_PREVIOUS_SECRET contains an unrunnable placeholder in production. Refusing to boot.',
      );
    }
    if (prev.length < MIN_JWT_SECRET_LENGTH) {
      throw new Error(
        `JWT_PREVIOUS_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long in production`,
      );
    }
    return prev;
  }

  if (isPlaceholderSecret(prev)) {
    return undefined;
  }

  if (prev.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_PREVIOUS_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`,
    );
  }

  return prev;
}

