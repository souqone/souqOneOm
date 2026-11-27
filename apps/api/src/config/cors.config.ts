import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEFAULT_CORS_ORIGINS = 'http://localhost:3000,http://localhost:3001';

export function getAllowedCorsOrigins(): string[] {
  return (process.env.CORS_ORIGINS || DEFAULT_CORS_ORIGINS)
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * Shared origin check used by both HTTP REST (app.enableCors) and WebSocket (/chat).
 * Native mobile / non-browser clients send no Origin header (`origin === undefined`),
 * so `!origin` is permitted; browser requests require an exact allowlist match.
 */
export function isCorsOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }
  return getAllowedCorsOrigins().includes(origin);
}

export function createCorsOptions(): CorsOptions {
  return {
    origin: (origin, callback) => {
      callback(null, isCorsOriginAllowed(origin));
    },
    credentials: true,
  };
}
