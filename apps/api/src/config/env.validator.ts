const PLACEHOLDER_PATTERNS = [
  'change_me',
  'change-me',
  'changeme',
  'your-',
  'dev-secret',
  'dummy',
  'fake',
  'todo',
  'placeholder',
];

export const MIN_SECRET_LENGTH = 32;

export function isPlaceholderSecret(val: string | undefined): boolean {
  if (!val || val.trim() === '') return true;
  const lower = val.toLowerCase().trim();
  return PLACEHOLDER_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function validateProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim() === '') {
    throw new Error('[EnvValidation] JWT_SECRET is required in production');
  }

  if (isPlaceholderSecret(jwtSecret)) {
    throw new Error(
      '[EnvValidation] JWT_SECRET contains an unrunnable placeholder in production. Refusing to boot.',
    );
  }

  if (jwtSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `[EnvValidation] JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long in production`,
    );
  }

  const jwtPreviousSecret = process.env.JWT_PREVIOUS_SECRET;
  if (jwtPreviousSecret && jwtPreviousSecret.trim() !== '') {
    if (isPlaceholderSecret(jwtPreviousSecret)) {
      throw new Error(
        '[EnvValidation] JWT_PREVIOUS_SECRET contains an unrunnable placeholder in production. Refusing to boot.',
      );
    }
    if (jwtPreviousSecret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `[EnvValidation] JWT_PREVIOUS_SECRET must be at least ${MIN_SECRET_LENGTH} characters long in production`,
      );
    }
  }

  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (jwtRefreshSecret && isPlaceholderSecret(jwtRefreshSecret)) {
    throw new Error(
      '[EnvValidation] JWT_REFRESH_SECRET contains an unrunnable placeholder in production. Refusing to boot.',
    );
  }
}

