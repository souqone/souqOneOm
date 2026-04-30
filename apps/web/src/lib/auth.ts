import { API_BASE } from './config';

export const authTokenKey = 'carone.auth_token';
export const refreshTokenKey = 'carone.refresh_token';

const apiBaseUrl = API_BASE;

function getBrowserStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function getAuthToken() {
  const storage = getBrowserStorage();
  return storage?.getItem(authTokenKey) ?? null;
}

export function setAuthToken(token: string) {
  const storage = getBrowserStorage();
  storage?.setItem(authTokenKey, token);
}

export function clearAuthToken() {
  const storage = getBrowserStorage();
  storage?.removeItem(authTokenKey);
}

export function getRefreshToken() {
  const storage = getBrowserStorage();
  return storage?.getItem(refreshTokenKey) ?? null;
}

export function setRefreshToken(token: string) {
  const storage = getBrowserStorage();
  storage?.setItem(refreshTokenKey, token);
}

export function clearRefreshToken() {
  const storage = getBrowserStorage();
  storage?.removeItem(refreshTokenKey);
}

export function clearAllTokens() {
  clearAuthToken();
  clearRefreshToken();
}

/**
 * Returns seconds until access token expires, or -1 if no/invalid token.
 */
export function tokenExpiresIn(): number {
  const token = getAuthToken();
  if (!token) return -1;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return -1;
  return payload.exp - Math.floor(Date.now() / 1000);
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempt to refresh the access token using the stored refresh token.
 * De-duplicates concurrent calls. Returns the new access token or null.
 */
export async function tryRefreshToken(): Promise<string | null> {
  // De-duplicate: if a refresh is already in-flight, wait for it
  if (refreshPromise) return refreshPromise;

  const rt = getRefreshToken();
  if (!rt) return null;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.accessToken) {
        setAuthToken(data.accessToken);
        if (data.refreshToken) setRefreshToken(data.refreshToken);
        return data.accessToken as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Low-level authenticated fetch with automatic 401 → refresh → retry.
 * Works for both JSON and FormData (uploads).
 * Use this instead of raw fetch() for any authenticated API call.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${apiBaseUrl}/api/v1${normalizedPath}`;

  const buildHeaders = (token: string | null): Headers => {
    const headers = new Headers(init.headers ?? {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  };

  let token = getAuthToken();
  let response = await fetch(url, { ...init, headers: buildHeaders(token) });

  if (response.status === 401 && token && !normalizedPath.startsWith('/auth/')) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      response = await fetch(url, { ...init, headers: buildHeaders(newToken) });
    }
  }

  return response;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers ?? {});

  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await apiFetch(path, { ...init, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'SERVER_ERROR');
  }

  return data as T;
}

export type JwtTokenPayload = {
  sub: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
};

export function decodeJwtPayload(token: string): JwtTokenPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      return null;
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = atob(normalized);

    return JSON.parse(decoded) as JwtTokenPayload;
  } catch {
    return null;
  }
}
