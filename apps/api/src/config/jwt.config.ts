import { isPlaceholderSecret } from './env.validator';

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
  }
  return secret || 'dev-secret';
}
