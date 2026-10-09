import * as jwt from 'jsonwebtoken';
import type { JwtModuleOptions } from '@nestjs/jwt';
import { isPlaceholderSecret } from './env.validator';

export const MIN_JWT_SECRET_LENGTH = 32;
export const DEV_FALLBACK_SECRET = 'dev-secret-minimum-32-chars-long-for-testing!!';

export function getJwtModuleOptions(): JwtModuleOptions {
  return {
    secret: getJwtSecret(),
    signOptions: {
      expiresIn: (process.env.JWT_EXPIRATION || '15m') as any,
      algorithm: 'HS256',
    },
  };
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const env = process.env.NODE_ENV;

  if (env === 'production') {
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

  if (env === 'development' || env === 'test') {
    if (secret && !isPlaceholderSecret(secret)) {
      if (secret.length < MIN_JWT_SECRET_LENGTH) {
        throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`);
      }
      return secret;
    }
    return DEV_FALLBACK_SECRET;
  }

  // Any other environment (unset, staging, preview, etc.): reject and throw at boot
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET environment variable is required');
  }
  if (isPlaceholderSecret(secret)) {
    throw new Error('JWT_SECRET contains an unrunnable placeholder. Refusing to boot.');
  }
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`);
  }
  return secret;
}

export function getJwtPreviousSecret(): string | undefined {
  const prev = process.env.JWT_PREVIOUS_SECRET;
  if (!prev || prev.trim() === '') {
    return undefined;
  }

  const env = process.env.NODE_ENV;

  if (env === 'production') {
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

  if (env === 'development' || env === 'test') {
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

  // Any other environment
  if (isPlaceholderSecret(prev)) {
    throw new Error('JWT_PREVIOUS_SECRET contains an unrunnable placeholder. Refusing to boot.');
  }
  if (prev.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_PREVIOUS_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`,
    );
  }
  return prev;
}

export function resolveJwtSecretForToken(rawJwtToken: string): string {
  const currentSecret = getJwtSecret();
  const previousSecret = getJwtPreviousSecret();

  if (!previousSecret) {
    return currentSecret;
  }

  try {
    jwt.verify(rawJwtToken, currentSecret, { algorithms: ['HS256'], ignoreExpiration: true });
    return currentSecret;
  } catch {
    try {
      jwt.verify(rawJwtToken, previousSecret, { algorithms: ['HS256'], ignoreExpiration: true });
      return previousSecret;
    } catch {
      return currentSecret;
    }
  }
}

export function verifyAccessToken<T = any>(token: string): T {
  const secret = resolveJwtSecretForToken(token);
  return jwt.verify(token, secret, { algorithms: ['HS256'] }) as T;
}
