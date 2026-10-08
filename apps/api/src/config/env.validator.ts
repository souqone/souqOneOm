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

  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (jwtRefreshSecret && isPlaceholderSecret(jwtRefreshSecret)) {
    throw new Error(
      '[EnvValidation] JWT_REFRESH_SECRET contains an unrunnable placeholder in production. Refusing to boot.',
    );
  }
}
